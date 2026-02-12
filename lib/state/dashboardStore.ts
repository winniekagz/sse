import { create } from "zustand";

import type { StreamEvent, SystemEvent, OrderEvent } from "@/lib/events";
import { createSeedEvents } from "@/lib/stream/sampleData";

export type ConnectionStatus =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "offline";

export type OrderStatus = "created" | "authorized" | "failed";

export type OrderRow = {
  orderId: string;
  customerId: string;
  country: string;
  category: string;
  amount: number;
  currency: "USD";
  status: OrderStatus;
  createdAt: number;
  updatedAt: number;
};

export type CustomerRow = {
  customerId: string;
  country: string;
  orders: number;
  spend: number;
  lastOrderId: string;
  lastStatus: OrderStatus;
  lastUpdatedAt: number;
};

export type CategorySalesRow = {
  name: string;
  value: number;
};

export type CountrySalesRow = {
  name: string;
  share: number;
};

export type LinePoint = {
  label: string;
  count: number;
  at: number;
};

export type OutcomePoint = {
  name: "Success" | "Failure";
  value: number;
};

type CreatedMetric = { at: number; amount: number; orderId: string };
type OutcomeMetric = { at: number; ok: boolean; orderId: string };

export type DashboardState = {
  connection: ConnectionStatus;
  lastUpdatedAt: number | null;
  orders: OrderRow[];
  customers: CustomerRow[];
  categorySales: CategorySalesRow[];
  countrySales: CountrySalesRow[];
  eventLog: StreamEvent[];
  ordersPerMinute: number;
  successRate: number;
  avgOrderValue: number;
  lineSeries: LinePoint[];
  outcomeSeries: OutcomePoint[];
  createdWindow: CreatedMetric[];
  outcomeWindow: OutcomeMetric[];
  processedEventIds: string[];
  orderEventsById: Record<string, OrderEvent[]>;
};

type DashboardStore = DashboardState & {
  ingestBatch: (events: StreamEvent[], receivedAt: number) => void;
  reset: () => void;
};

const WINDOW_MS = 60_000;

const formatTime = (value: number) =>
  new Date(value).toLocaleTimeString(undefined, {
    hour12: false,
    minute: "2-digit",
    second: "2-digit",
  });

const buildLineSeries = (now: number, created: CreatedMetric[]) => {
  const buckets = new Map<number, number>();
  created.forEach((item) => {
    const key = Math.floor(item.at / 1000) * 1000;
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  });

  const points: LinePoint[] = [];
  for (let i = 59; i >= 0; i -= 1) {
    const at = now - i * 1000;
    const key = Math.floor(at / 1000) * 1000;
    points.push({
      at,
      label: formatTime(at),
      count: buckets.get(key) ?? 0,
    });
  }
  return points;
};

const buildOutcomeSeries = (outcomes: OutcomeMetric[]) => {
  const success = outcomes.filter((item) => item.ok).length;
  const failure = outcomes.length - success;
  return [
    { name: "Success", value: success },
    { name: "Failure", value: failure },
  ] as OutcomePoint[];
};

const updateConnection = (connection: ConnectionStatus, event: SystemEvent) => {
  if (event.type === "stream_connected") return "connected";
  if (event.type === "stream_reconnecting") return "reconnecting";
  if (event.type === "stream_reconnected") return "connected";
  if (event.type === "stream_disconnected") return "offline";
  return connection;
};

const pruneByWindow = <T extends { at: number }>(items: T[], now: number) =>
  items.filter((item) => now - item.at <= WINDOW_MS);

const buildCustomers = (orders: OrderRow[]): CustomerRow[] => {
  const grouped = new Map<string, CustomerRow>();

  orders.forEach((order) => {
    const current = grouped.get(order.customerId);
    if (!current) {
      grouped.set(order.customerId, {
        customerId: order.customerId,
        country: order.country,
        orders: 1,
        spend: order.amount,
        lastOrderId: order.orderId,
        lastStatus: order.status,
        lastUpdatedAt: order.updatedAt,
      });
      return;
    }

    current.orders += 1;
    current.spend += order.amount;
    if (order.updatedAt >= current.lastUpdatedAt) {
      current.lastUpdatedAt = order.updatedAt;
      current.lastOrderId = order.orderId;
      current.lastStatus = order.status;
      current.country = order.country;
    }
  });

  return [...grouped.values()]
    .sort((a, b) => b.lastUpdatedAt - a.lastUpdatedAt)
    .slice(0, 25);
};

const buildCategorySales = (orders: OrderRow[]): CategorySalesRow[] => {
  const totals = new Map<string, number>();
  let sum = 0;

  orders.forEach((order) => {
    const next = (totals.get(order.category) ?? 0) + order.amount;
    totals.set(order.category, next);
    sum += order.amount;
  });

  if (!totals.size || sum <= 0) return [];

  return [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, amount]) => ({
      name,
      value: Math.max(1, Math.round((amount / sum) * 100)),
    }));
};

const buildCountrySales = (orders: OrderRow[]): CountrySalesRow[] => {
  const totals = new Map<string, number>();
  let sum = 0;

  orders.forEach((order) => {
    const next = (totals.get(order.country) ?? 0) + order.amount;
    totals.set(order.country, next);
    sum += order.amount;
  });

  if (!totals.size || sum <= 0) return [];

  return [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, amount]) => ({
      name,
      share: Math.max(1, Math.round((amount / sum) * 100)),
    }))
    .slice(0, 8);
};

const emptyDashboardState: DashboardState = {
  connection: "connecting",
  lastUpdatedAt: null,
  orders: [],
  customers: [],
  categorySales: [],
  countrySales: [],
  eventLog: [],
  ordersPerMinute: 0,
  successRate: 0,
  avgOrderValue: 0,
  lineSeries: [],
  outcomeSeries: [
    { name: "Success", value: 0 },
    { name: "Failure", value: 0 },
  ],
  createdWindow: [],
  outcomeWindow: [],
  processedEventIds: [],
  orderEventsById: {},
};

const reduceEventBatch = (
  state: DashboardState,
  events: StreamEvent[],
  receivedAt: number,
): DashboardState => {
  const now = receivedAt;
  let connection = state.connection;
  let orders = [...state.orders];
  const eventLog = [...state.eventLog];
  let createdWindow = [...state.createdWindow];
  let outcomeWindow = [...state.outcomeWindow];
  let processedEventIds = [...state.processedEventIds];
  let orderEventsById = { ...state.orderEventsById };
  const processedSet = new Set(processedEventIds);

  events.forEach((event) => {
    if (processedSet.has(event.id)) return;
    processedSet.add(event.id);
    processedEventIds.push(event.id);

    eventLog.unshift(event);
    if (eventLog.length > 100) eventLog.pop();

    if (
      event.type === "stream_connected" ||
      event.type === "stream_disconnected" ||
      event.type === "stream_reconnecting" ||
      event.type === "stream_reconnected"
    ) {
      connection = updateConnection(connection, event);
      return;
    }

    if ("orderId" in event) {
      const existing = orderEventsById[event.orderId] ?? [];
      const next = [event as OrderEvent, ...existing].slice(0, 16);
      orderEventsById = { ...orderEventsById, [event.orderId]: next };
    }

    if (event.type === "order_created") {
      const existing = orders.find((item) => item.orderId === event.orderId);
      if (!existing) {
        orders.unshift({
          orderId: event.orderId,
          customerId: event.customerId,
          country: event.country,
          category: event.category,
          amount: event.amount,
          currency: event.currency,
          status: "created",
          createdAt: event.createdAt,
          updatedAt: event.createdAt,
        });
      }
      createdWindow.push({
        at: event.createdAt,
        amount: event.amount,
        orderId: event.orderId,
      });
    }

    if (event.type === "payment_authorized") {
      if (!orders.some((item) => item.orderId === event.orderId)) {
        orders.unshift({
          orderId: event.orderId,
          customerId: "cus_unknown",
          country: "Unknown",
          category: "Unknown",
          amount: 0,
          currency: "USD",
          status: "created",
          createdAt: event.authorizedAt,
          updatedAt: event.authorizedAt,
        });
      }
      orders = orders.map((order) =>
        order.orderId === event.orderId
          ? { ...order, status: "authorized", updatedAt: event.authorizedAt }
          : order,
      );
      outcomeWindow.push({
        at: event.authorizedAt,
        ok: true,
        orderId: event.orderId,
      });
    }

    if (event.type === "payment_failed") {
      if (!orders.some((item) => item.orderId === event.orderId)) {
        orders.unshift({
          orderId: event.orderId,
          customerId: "cus_unknown",
          country: "Unknown",
          category: "Unknown",
          amount: 0,
          currency: "USD",
          status: "created",
          createdAt: event.failedAt,
          updatedAt: event.failedAt,
        });
      }
      orders = orders.map((order) =>
        order.orderId === event.orderId
          ? { ...order, status: "failed", updatedAt: event.failedAt }
          : order,
      );
      outcomeWindow.push({
        at: event.failedAt,
        ok: false,
        orderId: event.orderId,
      });
    }
  });

  orders = orders.slice(0, 50);
  if (processedEventIds.length > 400) {
    processedEventIds = processedEventIds.slice(-400);
  }
  createdWindow = pruneByWindow(createdWindow, now);
  outcomeWindow = pruneByWindow(outcomeWindow, now);

  const ordersPerMinute = createdWindow.length;
  const avgOrderValue =
    createdWindow.reduce((sum, item) => sum + item.amount, 0) /
    (createdWindow.length || 1);
  const successCount = outcomeWindow.filter((item) => item.ok).length;
  const successRate = outcomeWindow.length
    ? successCount / outcomeWindow.length
    : 0;

  return {
    ...state,
    connection,
    lastUpdatedAt: now,
    orders,
    customers: buildCustomers(orders),
    categorySales: buildCategorySales(orders),
    countrySales: buildCountrySales(orders),
    eventLog,
    ordersPerMinute,
    avgOrderValue,
    successRate,
    createdWindow,
    outcomeWindow,
    processedEventIds,
    orderEventsById,
    lineSeries: buildLineSeries(now, createdWindow),
    outcomeSeries: buildOutcomeSeries(outcomeWindow),
  };
};

export const initialDashboardState = reduceEventBatch(
  emptyDashboardState,
  createSeedEvents(Date.now()),
  Date.now(),
);

export const useDashboardStore = create<DashboardStore>((set) => ({
  ...initialDashboardState,
  ingestBatch: (events, receivedAt) =>
    set((state) => reduceEventBatch(state, events, receivedAt)),
  reset: () => set(initialDashboardState),
}));

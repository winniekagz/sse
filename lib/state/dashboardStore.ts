import { create } from "zustand";

import type { OrderEvent, StreamEvent, SystemEvent } from "@/lib/events";

export type ConnectionStatus =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "offline";

export type OrderStatus = "created" | "authorized" | "failed";

export type OrderRow = {
  orderId: string;
  amount: number;
  currency: "USD";
  status: OrderStatus;
  createdAt: number;
  updatedAt: number;
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
  eventLog: StreamEvent[];
  ordersPerMinute: number;
  successRate: number;
  avgOrderValue: number;
  lineSeries: LinePoint[];
  outcomeSeries: OutcomePoint[];
  createdWindow: CreatedMetric[];
  outcomeWindow: OutcomeMetric[];
  processedEventIds: string[];
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
  ];
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

export const initialDashboardState: DashboardState = {
  connection: "connecting",
  lastUpdatedAt: null,
  orders: [],
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
  const processedSet = new Set(processedEventIds);

  events.forEach((event) => {
    if (processedSet.has(event.id)) return;
    processedSet.add(event.id);
    processedEventIds.push(event.id);

    eventLog.unshift(event);
    if (eventLog.length > 100) eventLog.pop();

    if (event.type.startsWith("stream_")) {
      connection = updateConnection(connection, event);
      return;
    }

    const orderEvent = event as OrderEvent;
    if (orderEvent.type === "order_created") {
      const existing = orders.find((item) => item.orderId === orderEvent.orderId);
      if (!existing) {
        orders.unshift({
          orderId: orderEvent.orderId,
          amount: orderEvent.amount,
          currency: orderEvent.currency,
          status: "created",
          createdAt: orderEvent.createdAt,
          updatedAt: orderEvent.createdAt,
        });
      }
      createdWindow.push({
        at: orderEvent.createdAt,
        amount: orderEvent.amount,
        orderId: orderEvent.orderId,
      });
    }

    if (orderEvent.type === "payment_authorized") {
      if (!orders.some((item) => item.orderId === orderEvent.orderId)) {
        orders.unshift({
          orderId: orderEvent.orderId,
          amount: 0,
          currency: "USD",
          status: "created",
          createdAt: orderEvent.authorizedAt,
          updatedAt: orderEvent.authorizedAt,
        });
      }
      orders = orders.map((order) =>
        order.orderId === orderEvent.orderId
          ? { ...order, status: "authorized", updatedAt: orderEvent.authorizedAt }
          : order,
      );
      outcomeWindow.push({
        at: orderEvent.authorizedAt,
        ok: true,
        orderId: orderEvent.orderId,
      });
    }

    if (orderEvent.type === "payment_failed") {
      if (!orders.some((item) => item.orderId === orderEvent.orderId)) {
        orders.unshift({
          orderId: orderEvent.orderId,
          amount: 0,
          currency: "USD",
          status: "created",
          createdAt: orderEvent.failedAt,
          updatedAt: orderEvent.failedAt,
        });
      }
      orders = orders.map((order) =>
        order.orderId === orderEvent.orderId
          ? { ...order, status: "failed", updatedAt: orderEvent.failedAt }
          : order,
      );
      outcomeWindow.push({
        at: orderEvent.failedAt,
        ok: false,
        orderId: orderEvent.orderId,
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
    eventLog,
    ordersPerMinute,
    avgOrderValue,
    successRate,
    createdWindow,
    outcomeWindow,
    processedEventIds,
    lineSeries: buildLineSeries(now, createdWindow),
    outcomeSeries: buildOutcomeSeries(outcomeWindow),
  };
};

export const useDashboardStore = create<DashboardStore>((set) => ({
  ...initialDashboardState,
  ingestBatch: (events, receivedAt) =>
    set((state) => reduceEventBatch(state, events, receivedAt)),
  reset: () => set(initialDashboardState),
}));

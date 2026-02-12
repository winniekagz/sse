import type { OrderEvent, StreamEvent } from "@/lib/events";
import { KPI_THRESHOLDS } from "@/lib/metrics/thresholds";
import {
  mapEventTypeToStatus,
  STATUS_RANK,
  type DerivedIssue,
  type OrderStatusValue,
} from "@/lib/domain/orders/eventTypes";

export type OrderAggregate = {
  orderId: string;
  customerId: string;
  country: string;
  category: string;
  amount: number;
  currency: "USD";
  status: OrderStatusValue;
  createdAt: number;
  updatedAt: number;
  lastUpdatedAt: number;
  currentStatus: OrderStatusValue;
  currentIssue: DerivedIssue;
  timeline: OrderEvent[];
};

export type OrdersDomainStore = {
  ordersById: Record<string, OrderAggregate>;
  orderTimelinesById: Record<string, OrderEvent[]>;
  seenEventIds: Record<string, true>;
  lastSeq: number;
};

export const emptyOrdersDomainStore: OrdersDomainStore = {
  ordersById: {},
  orderTimelinesById: {},
  seenEventIds: {},
  lastSeq: 0,
};

function isOrderEvent(event: StreamEvent): event is OrderEvent {
  return "orderId" in event;
}

function getOrderEventAt(event: OrderEvent): number {
  if ("createdAt" in event) return event.createdAt;
  if ("authorizedAt" in event) return event.authorizedAt;
  if ("failedAt" in event) return event.failedAt;
  if ("pickedAt" in event) return event.pickedAt;
  if ("shippedAt" in event) return event.shippedAt;
  if ("deliveredAt" in event) return event.deliveredAt;
  return event.cancelledAt;
}

function computeIssue(order: OrderAggregate, now: number): DerivedIssue {
  if (order.currentStatus === "failed") return "PAYMENT_FAILED";
  if (
    order.currentStatus === "created" &&
    now - order.createdAt > KPI_THRESHOLDS.paymentPendingMs
  ) {
    return "STUCK_PENDING";
  }
  if (
    (order.currentStatus === "authorized" || order.currentStatus === "picked") &&
    now - order.updatedAt > KPI_THRESHOLDS.shippingLateMs
  ) {
    return "SHIPPING_DELAY";
  }
  return null;
}

function ensureAggregate(event: OrderEvent): OrderAggregate {
  const at = getOrderEventAt(event);
  if (event.type === "order_created") {
    return {
      orderId: event.orderId,
      customerId: event.customerId,
      country: event.country,
      category: event.category,
      amount: event.amount,
      currency: event.currency,
      status: "created",
      createdAt: event.createdAt,
      updatedAt: event.createdAt,
      lastUpdatedAt: event.createdAt,
      currentStatus: "created",
      currentIssue: null,
      timeline: [],
    };
  }

  return {
    orderId: event.orderId,
    customerId: "cus_unknown",
    country: "Unknown",
    category: "Unknown",
    amount: 0,
    currency: "USD",
    status: "created",
    createdAt: at,
    updatedAt: at,
    lastUpdatedAt: at,
    currentStatus: "created",
    currentIssue: null,
    timeline: [],
  };
}

function shouldIgnoreRegression(
  current: OrderStatusValue,
  next: OrderStatusValue,
) {
  const currentRank = STATUS_RANK[current];
  const nextRank = STATUS_RANK[next];
  if (nextRank >= currentRank) return false;
  return true;
}

function insertTimelineEvent(timeline: OrderEvent[], event: OrderEvent): OrderEvent[] {
  const next = [...timeline, event];
  next.sort((a, b) => {
    const seqDiff = a.seq - b.seq;
    if (seqDiff !== 0) return seqDiff;
    return getOrderEventAt(a) - getOrderEventAt(b);
  });
  if (next.length > 32) {
    return next.slice(-32);
  }
  return next;
}

export function reduceOrder(
  prevOrder: OrderAggregate | undefined,
  event: OrderEvent,
  now: number,
): OrderAggregate {
  const base = prevOrder ?? ensureAggregate(event);
  const eventStatus = mapEventTypeToStatus(event.type);
  const eventAt = getOrderEventAt(event);
  const timeline = insertTimelineEvent(base.timeline, event);

  const nextOrder: OrderAggregate = {
    ...base,
    timeline,
    lastUpdatedAt: Math.max(base.lastUpdatedAt, eventAt),
    updatedAt: Math.max(base.updatedAt, eventAt),
  };

  if (event.type === "order_created") {
    nextOrder.customerId = event.customerId;
    nextOrder.country = event.country;
    nextOrder.category = event.category;
    nextOrder.amount = event.amount;
    nextOrder.currency = event.currency;
    nextOrder.createdAt = Math.min(base.createdAt, event.createdAt);
  }

  if (eventStatus && !shouldIgnoreRegression(base.currentStatus, eventStatus)) {
    nextOrder.currentStatus = eventStatus;
    nextOrder.status = eventStatus;
  }

  nextOrder.currentIssue = computeIssue(nextOrder, now);
  return nextOrder;
}

export function applyEventToStore(
  store: OrdersDomainStore,
  event: StreamEvent,
  now: number,
): OrdersDomainStore {
  const eventId = event.eventId ?? event.id;
  if (store.seenEventIds[eventId]) {
    return store;
  }

  const nextSeen: Record<string, true> = {
    ...store.seenEventIds,
    [eventId]: true,
  };
  if (!isOrderEvent(event)) {
    return {
      ...store,
      seenEventIds: nextSeen,
      lastSeq: Math.max(store.lastSeq, event.seq),
    };
  }

  const currentOrder = store.ordersById[event.orderId];
  const nextOrder = reduceOrder(currentOrder, event, now);
  const nextOrdersById = {
    ...store.ordersById,
    [event.orderId]: nextOrder,
  };
  const nextTimelinesById = {
    ...store.orderTimelinesById,
    [event.orderId]: nextOrder.timeline,
  };

  return {
    ordersById: nextOrdersById,
    orderTimelinesById: nextTimelinesById,
    seenEventIds: nextSeen,
    lastSeq: Math.max(store.lastSeq, event.seq),
  };
}

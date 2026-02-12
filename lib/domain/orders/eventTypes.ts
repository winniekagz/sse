import type { OrderEventType } from "@/lib/events";

export const ORDER_EVENT_TYPES: OrderEventType[] = [
  "order_created",
  "payment_authorized",
  "payment_failed",
  "order_picked",
  "order_shipped",
  "order_delivered",
  "order_cancelled",
];

export type DerivedIssue =
  | "PAYMENT_FAILED"
  | "STUCK_PENDING"
  | "SHIPPING_DELAY"
  | null;

export const STATUS_RANK: Record<OrderStatusValue, number> = {
  created: 1,
  authorized: 2,
  picked: 3,
  shipped: 4,
  delivered: 5,
  failed: 6,
  cancelled: 7,
};

export type OrderStatusValue =
  | "created"
  | "authorized"
  | "picked"
  | "shipped"
  | "delivered"
  | "failed"
  | "cancelled";

export function mapEventTypeToStatus(type: OrderEventType): OrderStatusValue | null {
  if (type === "order_created") return "created";
  if (type === "payment_authorized") return "authorized";
  if (type === "order_picked") return "picked";
  if (type === "order_shipped") return "shipped";
  if (type === "order_delivered") return "delivered";
  if (type === "payment_failed") return "failed";
  if (type === "order_cancelled") return "cancelled";
  return null;
}


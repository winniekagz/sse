import type { OrderRow } from "@/lib/state/dashboardStore";

export type OrdersFilter =
  | { id: "all"; label: string }
  | { id: "failed"; label: string }
  | { id: "pending"; label: string }
  | { id: "shipped"; label: string }
  | { id: "delivered"; label: string }
  | { id: "payment_stuck"; label: string; thresholdMs: number }
  | { id: "shipping_at_risk"; label: string; thresholdMs: number }
  | { id: "failed_recent"; label: string; orderIds: string[] };

export const applyOrdersFilter = (
  orders: OrderRow[],
  filter: OrdersFilter,
  now: number,
) => {
  if (filter.id === "all") return orders;
  if (filter.id === "failed") {
    return orders.filter((order) => order.status === "failed");
  }
  if (filter.id === "pending") {
    return orders.filter(
      (order) =>
        order.status === "created" ||
        order.status === "authorized" ||
        order.status === "picked",
    );
  }
  if (filter.id === "shipped") {
    return orders.filter((order) => order.status === "shipped");
  }
  if (filter.id === "delivered") {
    return orders.filter((order) => order.status === "delivered");
  }
  if (filter.id === "payment_stuck") {
    return orders.filter(
      (order) =>
        order.status === "created" && now - order.createdAt > filter.thresholdMs,
    );
  }
  if (filter.id === "shipping_at_risk") {
    return orders.filter(
      (order) =>
        order.status === "authorized" &&
        now - order.updatedAt > filter.thresholdMs,
    );
  }
  if (filter.id === "failed_recent") {
    const set = new Set(filter.orderIds);
    return orders.filter((order) => set.has(order.orderId));
  }
  return orders;
};

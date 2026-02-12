import type { OrderEvent } from "@/lib/events";
import type { OrderAggregate } from "@/lib/domain/orders/reducer";

export type SimpleKpis = {
  total: number;
  failed: number;
  pending: number;
  shipped: number;
  delivered: number;
};

export function selectOrders(
  ordersById: Record<string, OrderAggregate>,
  limit = 50,
): OrderAggregate[] {
  return Object.values(ordersById)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, limit);
}

export function selectOrderTimeline(
  orderTimelinesById: Record<string, OrderEvent[]>,
  orderId: string | null,
): OrderEvent[] {
  if (!orderId) return [];
  const timeline = orderTimelinesById[orderId] ?? [];
  return [...timeline].sort((a, b) => b.seq - a.seq || b.ts - a.ts);
}

export function computeKpis(
  ordersById: Record<string, OrderAggregate>,
): SimpleKpis {
  const orders = Object.values(ordersById);
  return orders.reduce<SimpleKpis>(
    (acc, order) => {
      acc.total += 1;
      if (order.status === "failed") acc.failed += 1;
      if (
        order.status === "created" ||
        order.status === "authorized" ||
        order.status === "picked"
      ) {
        acc.pending += 1;
      }
      if (order.status === "shipped") acc.shipped += 1;
      if (order.status === "delivered") acc.delivered += 1;
      return acc;
    },
    { total: 0, failed: 0, pending: 0, shipped: 0, delivered: 0 },
  );
}


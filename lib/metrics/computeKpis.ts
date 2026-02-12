import type { StreamEvent } from "@/lib/events";
import type { OrderRow } from "@/lib/state/dashboardStore";
import { KPI_THRESHOLDS } from "@/lib/metrics/thresholds";

export type KpiMetrics = {
  ordersToday: number;
  revenueToday: number;
  failedPayments: number;
  atRiskShipments: number;
  avgStateMinutes: number;
  hasData: boolean;
};

const startOfToday = (now: number) => {
  const date = new Date(now);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};

export function computeKpis(
  orders: OrderRow[],
  events: StreamEvent[],
  now: number,
): KpiMetrics {
  const todayStart = startOfToday(now);
  const ordersToday = orders.filter((order) => order.createdAt >= todayStart);
  const revenueToday = ordersToday.reduce((sum, order) => sum + order.amount, 0);

  const failedPayments = events.filter(
    (event) =>
      event.type === "payment_failed" &&
      "failedAt" in event &&
      event.failedAt >= todayStart,
  ).length;

  const atRiskShipments = orders.filter(
    (order) =>
      order.status === "authorized" &&
      now - order.updatedAt > KPI_THRESHOLDS.shippingLateMs,
  ).length;

  const updatedToday = orders.filter((order) => order.updatedAt >= todayStart);
  const avgStateMinutes =
    updatedToday.reduce(
      (sum, order) => sum + Math.max(0, order.updatedAt - order.createdAt),
      0,
    ) /
    (updatedToday.length || 1) /
    1000 /
    60;

  return {
    ordersToday: ordersToday.length,
    revenueToday,
    failedPayments,
    atRiskShipments,
    avgStateMinutes,
    hasData: orders.length > 0 || events.length > 0,
  };
}

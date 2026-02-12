import type { StreamEvent } from "@/lib/events";
import type { OrderRow } from "@/lib/state/dashboardStore";
import { KPI_THRESHOLDS } from "@/lib/metrics/thresholds";

export type ExceptionKind =
  | "payment_stuck"
  | "shipping_delayed"
  | "failure_spike";

export type ExceptionItem = {
  id: string;
  kind: ExceptionKind;
  title: string;
  count: number;
  orderIds: string[];
  severity: "info" | "warning" | "danger";
  helper?: string;
};

const formatMinutes = (ms: number) => Math.round(ms / 60000);

export function computeExceptions(
  orders: OrderRow[],
  events: StreamEvent[],
  now: number,
) {
  const stuckOrders = orders.filter(
    (order) =>
      order.status === "created" &&
      now - order.createdAt > KPI_THRESHOLDS.paymentPendingMs,
  );

  const delayedShipments = orders.filter(
    (order) =>
      (order.status === "authorized" || order.status === "picked") &&
      now - order.updatedAt > KPI_THRESHOLDS.shippingLateMs,
  );

  const recentFailures = events.filter(
    (event) =>
      event.type === "payment_failed" &&
      "failedAt" in event &&
      now - event.failedAt <= KPI_THRESHOLDS.failureWindowMs,
  );

  return [
    {
      id: "exception_payment_stuck",
      kind: "payment_stuck",
      title: `${stuckOrders.length} orders at checkout risk (payment pending > ${formatMinutes(
        KPI_THRESHOLDS.paymentPendingMs,
      )} min)`,
      count: stuckOrders.length,
      orderIds: stuckOrders.map((order) => order.orderId),
      severity: stuckOrders.length ? "warning" : "info",
      helper: "Potential revenue loss if customers drop before payment is completed.",
    },
    {
      id: "exception_shipping_delayed",
      kind: "shipping_delayed",
      title: `${delayedShipments.length} shipments at SLA risk`,
      count: delayedShipments.length,
      orderIds: delayedShipments.map((order) => order.orderId),
      severity: delayedShipments.length ? "danger" : "info",
      helper: `Fulfillment SLA target: ${formatMinutes(KPI_THRESHOLDS.shippingLateMs)} min`,
    },
    {
      id: "exception_failure_spike",
      kind: "failure_spike",
      title: `${recentFailures.length} payment failures in the last ${formatMinutes(
        KPI_THRESHOLDS.failureWindowMs,
      )} minutes`,
      count: recentFailures.length,
      orderIds: Array.from(
        new Set(
          recentFailures
            .filter((event) => "orderId" in event)
            .map((event) => event.orderId),
        ),
      ),
      severity: recentFailures.length ? "danger" : "info",
      helper: "Payment instability can directly reduce conversion and daily revenue.",
    },
  ] as ExceptionItem[];
}

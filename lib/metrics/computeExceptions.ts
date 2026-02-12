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
      order.status === "authorized" &&
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
      title: `${stuckOrders.length} orders stuck in PAYMENT_PENDING > ${formatMinutes(
        KPI_THRESHOLDS.paymentPendingMs,
      )} min`,
      count: stuckOrders.length,
      orderIds: stuckOrders.map((order) => order.orderId),
      severity: stuckOrders.length ? "warning" : "info",
    },
    {
      id: "exception_shipping_delayed",
      kind: "shipping_delayed",
      title: `${delayedShipments.length} shipments delayed`,
      count: delayedShipments.length,
      orderIds: delayedShipments.map((order) => order.orderId),
      severity: delayedShipments.length ? "danger" : "info",
      helper: `SLA ${formatMinutes(KPI_THRESHOLDS.shippingLateMs)} min`,
    },
    {
      id: "exception_failure_spike",
      kind: "failure_spike",
      title: `${recentFailures.length} failures in last ${formatMinutes(
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
    },
  ] as ExceptionItem[];
}

import { computeExceptions } from "@/lib/metrics/computeExceptions";
import { computeKpis } from "@/lib/metrics/computeKpis";
import type { OrderRow } from "@/lib/state/dashboardStore";
import type { StreamEvent } from "@/lib/events";

const now = Date.now();

const baseOrder: OrderRow = {
  orderId: "ord_test",
  customerId: "cus_test",
  country: "United States",
  category: "Office",
  amount: 120,
  currency: "USD",
  status: "created",
  currentIssue: null,
  createdAt: now - 5 * 60 * 1000,
  updatedAt: now - 5 * 60 * 1000,
};

export function runComputeMetricsTests() {
  const orders: OrderRow[] = [baseOrder];
  const events: StreamEvent[] = [
    {
      id: "evt1",
      eventId: "evt1",
      ts: now - 60 * 1000,
      seq: 1,
      type: "payment_failed",
      orderId: baseOrder.orderId,
      failedAt: now - 60 * 1000,
      reason: "network_error",
    },
  ];

  const kpis = computeKpis(orders, events, now);
  if (kpis.ordersToday !== 1) {
    throw new Error("Expected ordersToday to count today order");
  }
  if (kpis.failedPayments < 1) {
    throw new Error("Expected failedPayments to count recent failure");
  }

  const exceptions = computeExceptions(orders, events, now);
  if (!exceptions.length) {
    throw new Error("Expected exceptions to return rows");
  }

  return true;
}

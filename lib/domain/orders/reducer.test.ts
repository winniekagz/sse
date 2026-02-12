import { applyEventToStore, emptyOrdersDomainStore } from "@/lib/domain/orders/reducer";
import type { OrderCreatedEvent, PaymentAuthorizedEvent, PaymentFailedEvent } from "@/lib/events";

const baseTs = Date.now();

export function runOrderReducerTests() {
  let store = emptyOrdersDomainStore;

  const created: OrderCreatedEvent = {
    id: "evt_1",
    eventId: "evt_1",
    seq: 1,
    ts: baseTs,
    type: "order_created",
    orderId: "ord_test_1",
    customerId: "cus_test",
    country: "United States",
    category: "Office",
    amount: 100,
    currency: "USD",
    createdAt: baseTs,
  };
  const duplicateCreated: OrderCreatedEvent = { ...created };
  const failed: PaymentFailedEvent = {
    id: "evt_2",
    eventId: "evt_2",
    seq: 2,
    ts: baseTs + 1200,
    type: "payment_failed",
    orderId: "ord_test_1",
    failedAt: baseTs + 1200,
    reason: "network_error",
  };
  const lateAuthorized: PaymentAuthorizedEvent = {
    id: "evt_0",
    eventId: "evt_0",
    seq: 0,
    ts: baseTs + 800,
    type: "payment_authorized",
    orderId: "ord_test_1",
    authorizedAt: baseTs + 800,
  };

  store = applyEventToStore(store, created, baseTs);
  store = applyEventToStore(store, duplicateCreated, baseTs);
  store = applyEventToStore(store, failed, baseTs + 2000);
  store = applyEventToStore(store, lateAuthorized, baseTs + 2100);

  const order = store.ordersById.ord_test_1;
  if (!order) {
    throw new Error("Expected order aggregate to exist");
  }
  if (order.status !== "failed") {
    throw new Error(`Expected failed status after regression guard, got ${order.status}`);
  }
  if (order.timeline.length !== 3) {
    throw new Error(`Expected deduped timeline with 3 events, got ${order.timeline.length}`);
  }
  if (store.lastSeq < 2) {
    throw new Error("Expected lastSeq tracking to advance");
  }
  return true;
}


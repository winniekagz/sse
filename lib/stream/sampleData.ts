import type { StreamEvent } from "@/lib/events";

function id(prefix: string, n: number) {
  return `${prefix}_${n.toString().padStart(4, "0")}`;
}

export function createSeedEvents(now: number): StreamEvent[] {
  const base = now - 45_000;

  const events = [
    { id: id("sys", 1), type: "stream_connected", at: base - 2000 },

    {
      id: id("evt", 1),
      type: "order_created",
      orderId: "ord_cus_acme_1001",
      customerId: "cus_acme",
      country: "United States",
      category: "Living room",
      amount: 249.99,
      currency: "USD",
      createdAt: base + 1000,
    },
    {
      id: id("evt", 2),
      type: "payment_authorized",
      orderId: "ord_cus_acme_1001",
      authorizedAt: base + 3000,
    },

    {
      id: id("evt", 3),
      type: "order_created",
      orderId: "ord_cus_globex_1002",
      customerId: "cus_globex",
      country: "Germany",
      category: "Office",
      amount: 799.0,
      currency: "USD",
      createdAt: base + 5000,
    },
    {
      id: id("evt", 4),
      type: "payment_failed",
      orderId: "ord_cus_globex_1002",
      failedAt: base + 9000,
      reason: "insufficient_funds",
    },

    {
      id: id("evt", 5),
      type: "order_created",
      orderId: "ord_cus_umbrella_1003",
      customerId: "cus_umbrella",
      country: "France",
      category: "Kitchen",
      amount: 145.49,
      currency: "USD",
      createdAt: base + 12_000,
    },
    {
      id: id("evt", 6),
      type: "payment_authorized",
      orderId: "ord_cus_umbrella_1003",
      authorizedAt: base + 14_000,
    },

    {
      id: id("evt", 7),
      type: "order_created",
      orderId: "ord_cus_acme_1004",
      customerId: "cus_acme",
      country: "United States",
      category: "Decor",
      amount: 1120.0,
      currency: "USD",
      createdAt: base + 18_000,
    },
    {
      id: id("evt", 8),
      type: "payment_authorized",
      orderId: "ord_cus_acme_1004",
      authorizedAt: base + 21_000,
    },

    { id: id("sys", 2), type: "stream_reconnecting", at: base + 24_000, attempt: 1 },
    { id: id("sys", 3), type: "stream_reconnected", at: base + 26_000 },
    { id: id("sys", 4), type: "stream_connected", at: base + 26_500 },

    {
      id: id("evt", 9),
      type: "order_created",
      orderId: "ord_cus_stark_1005",
      customerId: "cus_stark",
      country: "Canada",
      category: "Outdoor",
      amount: 67.25,
      currency: "USD",
      createdAt: base + 29_000,
    },
    {
      id: id("evt", 10),
      type: "payment_failed",
      orderId: "ord_cus_stark_1005",
      failedAt: base + 31_000,
      reason: "network_error",
    },
  ];

  return events.map((event, index) => {
    const ts =
      "at" in event
        ? event.at
        : "createdAt" in event
          ? event.createdAt
          : "authorizedAt" in event
            ? event.authorizedAt
            : "failedAt" in event
              ? event.failedAt
              : now;

    return {
      ...event,
      eventId: event.id,
      ts,
      seq: index + 1,
    };
  }) as StreamEvent[];
}

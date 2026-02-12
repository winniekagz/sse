import type { StreamEvent } from "@/lib/events";
import type { OrderRow } from "@/lib/state/dashboardStore";
import type { DomainSearchProvider, GlobalSearchHit } from "@/lib/search/types";

function includesAllTerms(haystack: string, terms: string[]) {
  if (terms.length === 0) return true;
  const text = haystack.toLowerCase();
  return terms.every((term) => text.includes(term));
}

function buildScore(base: number, at: number) {
  return base + at / 1_000_000_000_000;
}

export function createOrderSearchProvider(orders: OrderRow[]): DomainSearchProvider {
  return {
    domain: "orders",
    search: ({ query }) => {
      const hits: GlobalSearchHit[] = [];

      orders.forEach((order) => {
        const haystack = `${order.orderId} ${order.customerId} ${order.country} ${order.category} ${order.status} ${order.currency} ${order.amount.toFixed(2)}`;
        if (!includesAllTerms(haystack, query.terms)) return;

        const statusBoost = order.status === "failed" ? 3 : order.status === "authorized" ? 2 : 1;
        hits.push({
          id: `orders:${order.orderId}`,
          domain: "orders",
          title: `${order.orderId} (${order.status})`,
          subtitle: `${order.customerId} | ${order.country} | ${order.currency} ${order.amount.toFixed(2)}`,
          at: order.updatedAt,
          score: buildScore(70 + statusBoost, order.updatedAt),
        });
      });

      return hits.slice(0, 20);
    },
  };
}

export function createActivitySearchProvider(events: StreamEvent[]): DomainSearchProvider {
  return {
    domain: "activity",
    search: ({ query }) => {
      const hits: GlobalSearchHit[] = [];

      events.forEach((event) => {
        const at = event.ts;
        const orderId = "orderId" in event ? event.orderId : "system";
        const customerId = "customerId" in event ? event.customerId : "";
        const country = "country" in event ? event.country : "";
        const category = "category" in event ? event.category : "";
        const reason = "reason" in event ? event.reason : "";
        const haystack = `${event.type} ${orderId} ${customerId} ${country} ${category} ${reason}`;
        if (!includesAllTerms(haystack, query.terms)) return;

        hits.push({
          id: `activity:${event.id}`,
          domain: "activity",
          title: event.type,
          subtitle: `ref ${orderId}${customerId ? ` / ${customerId}` : ""}${country ? ` / ${country}` : ""}${reason ? ` (${reason})` : ""}`,
          at,
          score: buildScore(60, at),
        });
      });

      return hits.slice(0, 20);
    },
  };
}

type CustomerAggregate = {
  customerId: string;
  country: string;
  orderCount: number;
  spend: number;
  lastSeenAt: number;
};

function deriveCustomers(orders: OrderRow[]): CustomerAggregate[] {
  const map = new Map<string, CustomerAggregate>();

  orders.forEach((order) => {
    const customerId = order.customerId;
    const current = map.get(customerId);
    if (!current) {
      map.set(customerId, {
        customerId,
        country: order.country,
        orderCount: 1,
        spend: order.amount,
        lastSeenAt: order.updatedAt,
      });
      return;
    }

    current.orderCount += 1;
    current.spend += order.amount;
    current.lastSeenAt = Math.max(current.lastSeenAt, order.updatedAt);
    current.country = order.country;
  });

  return [...map.values()].sort((a, b) => b.lastSeenAt - a.lastSeenAt);
}

export function createCustomerSearchProvider(orders: OrderRow[]): DomainSearchProvider {
  return {
    domain: "customers",
    search: ({ query }) => {
      const customers = deriveCustomers(orders);
      const hits: GlobalSearchHit[] = [];

      customers.forEach((customer) => {
        const haystack = `${customer.customerId} ${customer.country} ${customer.orderCount} ${customer.spend.toFixed(2)}`;
        if (!includesAllTerms(haystack, query.terms)) return;

        hits.push({
          id: `customers:${customer.customerId}`,
          domain: "customers",
          title: customer.customerId,
          subtitle: `${customer.country} | ${customer.orderCount} orders | ${customer.spend.toFixed(2)} USD`,
          at: customer.lastSeenAt,
          score: buildScore(55 + Math.min(8, customer.orderCount), customer.lastSeenAt),
        });
      });

      return hits.slice(0, 20);
    },
  };
}

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CreditCard,
  LayoutDashboard,
  Map,
  Package,
  Search,
  Settings,
  ShoppingCart,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { DashboardTopNav } from "@/components/layout/DashboardTopNav";
import { ActivityTable } from "@/components/organisms/ActivityTable";
import { CustomersTable } from "@/components/organisms/CustomersTable";
import { ExceptionsPanel } from "@/components/organisms/ExceptionsPanel";
import { KpiStrip } from "@/components/organisms/KpiStrip";
import { OrderDrawer } from "@/components/organisms/OrderDrawer";
import { OrdersTable } from "@/components/organisms/OrdersTable";
import { computeKpis as computeSimpleKpis } from "@/lib/domain/orders/selectors";
import type { OrdersFilter } from "@/lib/filters/ordersFilter";
import { applyOrdersFilter } from "@/lib/filters/ordersFilter";
import { computeExceptions } from "@/lib/metrics/computeExceptions";
import { KPI_THRESHOLDS } from "@/lib/metrics/thresholds";
import { createSearchEventBus } from "@/lib/search/eventBus";
import {
  createActivitySearchProvider,
  createCustomerSearchProvider,
  createOrderSearchProvider,
} from "@/lib/search/providers";
import { createGlobalSearchService } from "@/lib/search/searchService";
import type {
  GlobalSearchHit,
  SearchDomain,
  SearchTriggerEvent,
} from "@/lib/search/types";
import { useDashboardStore } from "@/lib/state/dashboardStore";
import { createEventBuffer } from "@/lib/stream/buffer";
import { createFakeSse, type EventRate } from "@/lib/stream/fakeSse";

const FLUSH_INTERVAL_MS = 200;

const MENU_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Marketplace", icon: ShoppingCart },
  { label: "Orders", icon: Package },
  { label: "Tracking", icon: Map },
  { label: "Customers", icon: Users },
  { label: "Payments", icon: CreditCard },
  { label: "Settings", icon: Settings },
];

const CATEGORY_COLORS = [
  "#7c65f6",
  "#4f8ef7",
  "#b066e6",
  "#53b3e0",
  "#66d39d",
  "#ef71b7",
  "#ff7d66",
  "#f8b34e",
  "#4fd0c8",
];

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}


export default function HomePage() {
  const [chaosMode, setChaosMode] = useState(false);
  const [eventRate, setEventRate] = useState<EventRate>("normal");
  const [globalQuery, setGlobalQuery] = useState("");
  const [searchStatus, setSearchStatus] = useState<"idle" | "searching" | "ready">("idle");
  const [searchHits, setSearchHits] = useState<GlobalSearchHit[]>([]);
  const [searchMeta, setSearchMeta] = useState<{ domains: SearchDomain[]; terms: string[]; tookMs: number }>({
    domains: ["orders", "activity", "customers"],
    terms: [],
    tookMs: 0,
  });
  const [activeComponentKey, setActiveComponentKey] = useState<string | null>(null);
  const [searchTriggers, setSearchTriggers] = useState<SearchTriggerEvent[]>([]);
  const [ordersFilter, setOrdersFilter] = useState<OrdersFilter>({
    id: "all",
    label: "All orders",
  });
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const initialChaosModeRef = useRef(chaosMode);
  const initialEventRateRef = useRef(eventRate);
  const [searchEventBus] = useState(() => createSearchEventBus());

  const connection = useDashboardStore((state) => state.connection);
  const lastUpdatedAt = useDashboardStore((state) => state.lastUpdatedAt);
  const ordersPerMinute = useDashboardStore((state) => state.ordersPerMinute);
  const successRate = useDashboardStore((state) => state.successRate);
  const avgOrderValue = useDashboardStore((state) => state.avgOrderValue);
  const lineSeries = useDashboardStore((state) => state.lineSeries);
  const orders = useDashboardStore((state) => state.orders);
  const customers = useDashboardStore((state) => state.customers);
  const categorySales = useDashboardStore((state) => state.categorySales);
  const countrySales = useDashboardStore((state) => state.countrySales);
  const eventLog = useDashboardStore((state) => state.eventLog);
  const ordersById = useDashboardStore((state) => state.ordersById);
  const orderEventsById = useDashboardStore((state) => state.orderEventsById);

  const streamRef = useRef<ReturnType<typeof createFakeSse> | null>(null);
  const bufferRef = useRef<ReturnType<typeof createEventBuffer> | null>(null);
  const salesChartRef = useRef<HTMLElement | null>(null);
  const categoryMixRef = useRef<HTMLElement | null>(null);
  const countrySalesRef = useRef<HTMLElement | null>(null);
  const ordersTableRef = useRef<HTMLElement | null>(null);
  const activityTableRef = useRef<HTMLElement | null>(null);
  const customersTableRef = useRef<HTMLElement | null>(null);
  const streamSummaryRef = useRef<HTMLElement | null>(null);

  const focusDomainSection = useCallback((domain: SearchDomain) => {
    const sectionMap: Record<SearchDomain, { key: string; target: HTMLElement | null }> = {
      orders: { key: "orders_table", target: ordersTableRef.current },
      activity: { key: "activity_table", target: activityTableRef.current },
      customers: { key: "customers_table", target: customersTableRef.current },
    };

    const selection = sectionMap[domain];
    if (!selection) return;

    setActiveComponentKey(selection.key);
    selection.target?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  useEffect(() => {
    const unsubscribe = searchEventBus.subscribe((event) => {
      setSearchTriggers((prev) => [event, ...prev].slice(0, 8));
    });

    return unsubscribe;
  }, [searchEventBus]);

  const searchProviders = useMemo(
    () => ({
      orders: createOrderSearchProvider(orders),
      activity: createActivitySearchProvider(eventLog),
      customers: createCustomerSearchProvider(orders),
    }),
    [eventLog, orders],
  );

  const searchService = useMemo(
    () =>
      createGlobalSearchService({
        providers: searchProviders,
        eventBus: searchEventBus,
      }),
    [searchEventBus, searchProviders],
  );

  useEffect(() => {
    const stream = createFakeSse({
      chaosMode: initialChaosModeRef.current,
      eventRate: initialEventRateRef.current,
    });
    streamRef.current = stream;

    const buffer = createEventBuffer({
      flushIntervalMs: FLUSH_INTERVAL_MS,
      onFlush: (events) => {
        useDashboardStore.getState().ingestBatch(events, Date.now());
      },
    });
    buffer.start();
    bufferRef.current = buffer;

    const unsubscribe = stream.subscribe((event) => {
      buffer.push(event);
    });

    return () => {
      unsubscribe();
      buffer.flush();
      buffer.stop();
      stream.shutdown();
      streamRef.current = null;
      bufferRef.current = null;
      useDashboardStore.getState().reset();
    };
  }, []);

  useEffect(() => {
    streamRef.current?.setChaosMode(chaosMode);
  }, [chaosMode]);

  useEffect(() => {
    streamRef.current?.setEventRate(eventRate);
  }, [eventRate]);

  useEffect(() => {
    const query = globalQuery.trim();
    if (!query) {
      const resetTimer = setTimeout(() => {
        setSearchStatus("idle");
        setSearchHits([]);
        setActiveComponentKey(null);
        setSearchMeta({
          domains: ["orders", "activity", "customers"],
          terms: [],
          tookMs: 0,
        });
      }, 0);

      return () => clearTimeout(resetTimer);
    }

    const timer = setTimeout(() => {
      const result = searchService.search(query);
      setSearchHits(result.hits);
      setSearchMeta({
        domains: result.selectedDomains,
        terms: result.terms,
        tookMs: result.tookMs,
      });
      setSearchStatus("ready");
    }, 240);

    return () => clearTimeout(timer);
  }, [focusDomainSection, globalQuery, searchService]);

  const handleSimulateDisconnect = useCallback(() => {
    streamRef.current?.simulateDisconnect();
  }, []);
  const handleGlobalQueryChange = useCallback((value: string) => {
    setGlobalQuery(value);
    setSearchStatus(value.trim() ? "searching" : "idle");
  }, []);

  const now = lastUpdatedAt ?? 0;
  const filteredOrders = useMemo(
    () => applyOrdersFilter(orders, ordersFilter, now),
    [now, orders, ordersFilter],
  );
  const kpis = useMemo(() => computeSimpleKpis(ordersById), [ordersById]);
  const exceptions = useMemo(
    () => computeExceptions(orders, eventLog, now),
    [eventLog, now, orders],
  );
  const selectedOrder = useMemo(
    () => orders.find((order) => order.orderId === selectedOrderId) ?? null,
    [orders, selectedOrderId],
  );
  const selectedOrderEvents = useMemo(
    () => (selectedOrderId ? orderEventsById[selectedOrderId] ?? [] : []),
    [orderEventsById, selectedOrderId],
  );

  const salesData = useMemo(() => {
    const source = lineSeries.slice(-12);
    return source.map((point, index) => {
      const label = point.label.slice(0, 5);
      const base = 14_000 + index * 2_100;
      return {
        label,
        grossMargin: Math.round(base + point.count * 8_000),
        revenue: Math.round(base + point.count * 10_500 + (index % 3) * 2_200),
      };
    });
  }, [lineSeries]);

  return (
    <DashboardShell
      sidebar={(
        <DashboardSidebar
          menuItems={MENU_ITEMS}
          chaosMode={chaosMode}
          eventRate={eventRate}
          onChaosModeChange={setChaosMode}
          onEventRateChange={setEventRate}
          onSimulateDisconnect={handleSimulateDisconnect}
        />
      )}
      topNav={(
        <DashboardTopNav
          query={globalQuery}
          connection={connection}
          onQueryChange={handleGlobalQueryChange}
        />
      )}
    >
          <KpiStrip
            metrics={kpis}
            isLoading={orders.length === 0 && eventLog.length === 0}
            onSelectFilter={(filter) => {
              setOrdersFilter(filter);
              focusDomainSection("orders");
            }}
          />

          <section className="mt-4 grid gap-4 xl:grid-cols-[1.2fr_1fr]">
            <ExceptionsPanel
              items={exceptions}
              onSelect={(item) => {
                if (item.kind === "payment_stuck") {
                  setOrdersFilter({
                    id: "payment_stuck",
                    label: "Payment pending > 10 min",
                    thresholdMs: KPI_THRESHOLDS.paymentPendingMs,
                  });
                }
                if (item.kind === "shipping_delayed") {
                  setOrdersFilter({
                    id: "shipping_at_risk",
                    label: "At-risk shipments",
                    thresholdMs: KPI_THRESHOLDS.shippingLateMs,
                  });
                }
                if (item.kind === "failure_spike") {
                  setOrdersFilter({
                    id: "failed_recent",
                    label: "Failures last 5 min",
                    orderIds: item.orderIds,
                  });
                }
                focusDomainSection("orders");
              }}
            />
            <section className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-800">Executive Pulse</h3>
                <span className="text-xs text-slate-500">Live operating health</span>
              </div>
              <div className="space-y-3 text-sm text-slate-600">
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  Order throughput (per min): <span className="font-semibold">{ordersPerMinute}</span>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  Payment success rate: <span className="font-semibold">{(successRate * 100).toFixed(1)}%</span>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  Average order value (AOV): <span className="font-semibold">{formatMoney(avgOrderValue)}</span>
                </div>
              </div>
            </section>
          </section>

          <section className="mb-4 rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Global search (event-driven)
                </h2>
                <p className="text-xs text-slate-500">
                  Type mixed intent queries like:
                  {" "}
                  <span className="font-mono">order failed customer</span>
                  {" "}
                  or
                  {" "}
                  <span className="font-mono">activity stream_reconnecting</span>
                </p>
              </div>
              <div className="relative w-full max-w-md">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  value={globalQuery}
                  onChange={(event) => handleGlobalQueryChange(event.target.value)}
                  placeholder="Try: order customer country"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-emerald-300"
                />
              </div>
            </div>
            <div className="mt-3 grid gap-3 lg:grid-cols-[1.4fr_1fr]">
              <div className="space-y-2">
                {searchHits.slice(0, 6).map((hit) => (
                  <button
                    key={hit.id}
                    onClick={() => focusDomainSection(hit.domain)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left hover:bg-slate-100"
                  >
                    <p className="font-mono text-xs uppercase tracking-wide text-emerald-700">
                      {hit.domain}
                    </p>
                    <p className="text-sm font-medium text-slate-800">{hit.title}</p>
                    <p className="text-xs text-slate-500">{hit.subtitle}</p>
                  </button>
                ))}
                {searchStatus === "ready" && searchHits.length === 0 && (
                  <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-500">
                    No results for this query.
                  </p>
                )}
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                <p className="mb-2 font-semibold text-slate-700">Search status</p>
                <p>
                  {searchStatus === "idle" && "Idle - waiting for query."}
                  {searchStatus === "searching" && "Searching domains and emitting trigger events..."}
                  {searchStatus === "ready" && `Ready - ${searchHits.length} hits in ${searchMeta.tookMs}ms.`}
                </p>
                <p className="mt-2">
                  Domains:
                  {" "}
                  <span className="font-mono">{searchMeta.domains.join(", ")}</span>
                </p>
                <p className="mt-1">
                  Parsed terms:
                  {" "}
                  <span className="font-mono">{searchMeta.terms.length ? searchMeta.terms.join(", ") : "none"}</span>
                </p>
                <p className="mt-2">
                  Last trigger:
                  {" "}
                  {searchTriggers[0]
                    ? `${searchTriggers[0].type} at ${new Date(searchTriggers[0].at).toLocaleTimeString()}`
                    : "none"}
                </p>
              </div>
            </div>
          </section>

          <section
            ref={salesChartRef}
            className="mt-4 rounded-xl border border-slate-200 bg-white p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Product sales</h2>
              <div className="flex items-center gap-4 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#4f7ef2]" /> Gross margin
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#f1a13f]" /> Revenue
                </span>
              </div>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesData} barGap={10}>
                  <CartesianGrid stroke="#edf1ef" vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="grossMargin" fill="#4f7ef2" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="revenue" fill="#f1a13f" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="mt-4 grid gap-4 xl:grid-cols-[1.2fr_1fr]">
            <article
              ref={categoryMixRef}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              <h2 className="mb-4 text-3xl font-semibold tracking-tight">Sales by product category</h2>
              <div className="grid items-center gap-3 lg:grid-cols-[1fr_230px]">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {categorySales.map((item, index) => (
                    <div key={item.name} className="flex items-center gap-2 text-slate-700">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }}
                      />
                      {item.name} - {item.value}%
                    </div>
                  ))}
                </div>
                <div className="h-[210px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categorySales}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={52}
                        outerRadius={84}
                        paddingAngle={3}
                      >
                        {categorySales.map((item, index) => (
                          <Cell
                            key={item.name}
                            fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </article>

            <article
              ref={countrySalesRef}
              className={`rounded-xl border border-slate-200 bg-white p-4 ${
                activeComponentKey === "country_sales" ? "ring-2 ring-emerald-300" : ""
              }`}
            >
              <h2 className="mb-4 text-3xl font-semibold tracking-tight">Sales by countries</h2>
              <div className="space-y-2 text-sm">
                {countrySales.map((country) => (
                  <div key={country.name} className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="inline-flex items-center gap-2 text-slate-700">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                      {country.name}
                    </span>
                    <span className="font-semibold text-slate-800">{country.share}%</span>
                  </div>
                ))}
                {countrySales.length === 0 && (
                  <p className="text-slate-500">Waiting for country sales data...</p>
                )}
              </div>
            </article>
          </section>

          <section
            ref={streamSummaryRef}
            className={`mt-4 rounded-xl border border-slate-200 bg-white p-4 ${
              activeComponentKey === "stream_summary" ? "ring-2 ring-emerald-300" : ""
            }`}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Realtime stream summary</h3>
              <p className="text-xs text-slate-500">
                Last update: {lastUpdatedAt ? new Date(lastUpdatedAt).toLocaleTimeString() : "waiting"}
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                Orders/min: <span className="font-semibold">{ordersPerMinute}</span>
              </div>
              <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                Success rate: <span className="font-semibold">{(successRate * 100).toFixed(1)}%</span>
              </div>
              <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                Avg order value: <span className="font-semibold">{formatMoney(avgOrderValue)}</span>
              </div>
            </div>

            <p className="mt-3 text-xs text-slate-500">
              SSE stream updates this panel, category mix, country sales, and the
              tables below in realtime.
            </p>
          </section>

          <section className="mt-4 grid gap-4 xl:grid-cols-2">
            <article
              ref={ordersTableRef}
              className={activeComponentKey === "orders_table" ? "rounded-xl ring-2 ring-emerald-300" : "rounded-xl"}
            >
              <OrdersTable
                orders={filteredOrders}
                filterLabel={ordersFilter.id === "all" ? undefined : ordersFilter.label}
                onClearFilter={() => setOrdersFilter({ id: "all", label: "All orders" })}
                onRowClick={(order) => setSelectedOrderId(order.orderId)}
              />
            </article>
            <article
              ref={customersTableRef}
              className={activeComponentKey === "customers_table" ? "rounded-xl ring-2 ring-emerald-300" : "rounded-xl"}
            >
              <CustomersTable customers={customers} />
            </article>
          </section>

          <section
            ref={activityTableRef}
            className={`mt-4 rounded-xl ${
              activeComponentKey === "activity_table" ? "ring-2 ring-emerald-300" : ""
            }`}
          >
            <ActivityTable events={eventLog} />
          </section>
          <OrderDrawer
            open={Boolean(selectedOrder)}
            order={selectedOrder}
            events={selectedOrderEvents}
            onClose={() => setSelectedOrderId(null)}
          />
    </DashboardShell>
  );
}

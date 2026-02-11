"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  BadgeDollarSign,
  Boxes,
  ChartNoAxesCombined,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Map,
  Package,
  Settings,
  ShoppingCart,
  Users,
  Wifi,
  WifiOff,
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

function formatCompact(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export default function HomePage() {
  const [chaosMode, setChaosMode] = useState(false);
  const [eventRate, setEventRate] = useState<EventRate>("normal");
  const initialChaosModeRef = useRef(chaosMode);
  const initialEventRateRef = useRef(eventRate);

  const connection = useDashboardStore((state) => state.connection);
  const lastUpdatedAt = useDashboardStore((state) => state.lastUpdatedAt);
  const ordersPerMinute = useDashboardStore((state) => state.ordersPerMinute);
  const successRate = useDashboardStore((state) => state.successRate);
  const avgOrderValue = useDashboardStore((state) => state.avgOrderValue);
  const lineSeries = useDashboardStore((state) => state.lineSeries);
  const outcomeSeries = useDashboardStore((state) => state.outcomeSeries);
  const orders = useDashboardStore((state) => state.orders);
  const eventLog = useDashboardStore((state) => state.eventLog);

  const streamRef = useRef<ReturnType<typeof createFakeSse> | null>(null);
  const bufferRef = useRef<ReturnType<typeof createEventBuffer> | null>(null);

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

  const handleSimulateDisconnect = useCallback(() => {
    streamRef.current?.simulateDisconnect();
  }, []);

  const totalRevenue = useMemo(
    () => orders.reduce((sum, order) => sum + order.amount, 0),
    [orders],
  );

  const failedOrders = useMemo(
    () => orders.filter((order) => order.status === "failed").length,
    [orders],
  );

  const cards = useMemo(
    () => [
      {
        label: "Total customers",
        value: (567_000 + orders.length * 18).toLocaleString("en-US"),
        delta: `${(successRate * 4 + 1.1).toFixed(1)}%`,
        positive: true,
        icon: Users,
      },
      {
        label: "Total revenue",
        value: `${formatCompact(totalRevenue + 3_000_000)} `,
        delta: `${(successRate * 2.5).toFixed(1)}%`,
        positive: true,
        icon: BadgeDollarSign,
      },
      {
        label: "Total orders",
        value: formatCompact(1_000_000 + ordersPerMinute * 1300),
        delta: `${Math.max(0.1, (1 - successRate) * 1.1).toFixed(1)}%`,
        positive: false,
        icon: ShoppingCart,
      },
      {
        label: "Total returns",
        value: (1700 + failedOrders).toLocaleString("en-US"),
        delta: `${Math.max(0.1, (failedOrders / 60) * 1.4).toFixed(1)}%`,
        positive: true,
        icon: Boxes,
      },
    ],
    [failedOrders, orders.length, ordersPerMinute, successRate, totalRevenue],
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

  const categorySales = useMemo(() => {
    const success = outcomeSeries.find((item) => item.name === "Success")?.value ?? 0;
    const failure = outcomeSeries.find((item) => item.name === "Failure")?.value ?? 0;
    const total = success + failure || 1;

    return [
      { name: "Living room", value: Math.max(3, Math.round((success / total) * 26)) },
      { name: "Kids", value: 17 },
      { name: "Office", value: 13 },
      { name: "Bedroom", value: 12 },
      { name: "Kitchen", value: 9 },
      { name: "Bathroom", value: 8 },
      { name: "Dining room", value: 6 },
      { name: "Decor", value: 5 },
      { name: "Outdoor", value: 4 },
    ];
  }, [outcomeSeries]);

  const countries = [
    { name: "Poland", share: 19 },
    { name: "Austria", share: 15 },
    { name: "Spain", share: 13 },
    { name: "Romania", share: 12 },
    { name: "France", share: 11 },
    { name: "Italy", share: 11 },
    { name: "Germany", share: 10 },
    { name: "Ukraine", share: 9 },
  ];

  const recentEvents = eventLog.slice(0, 5);

  return (
    <div className="min-h-screen bg-[#f4f7f6] text-slate-800">
      <div className="mx-auto grid min-h-screen max-w-[1400px] lg:grid-cols-[230px_1fr]">
        <aside className="border-r border-slate-200 bg-[#eef3f1] p-5">
          <div className="mb-8 flex items-center gap-2 text-xl font-semibold text-[#145f47]">
            <Activity className="h-5 w-5" />
            Flup
          </div>

          <div className="space-y-2">
            {MENU_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm ${
                    item.active
                      ? "bg-[#d9ebe3] font-semibold text-[#145f47]"
                      : "text-slate-600 hover:bg-[#e5efeb]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="mt-10 rounded-xl border border-slate-200 bg-white p-3">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <ChartNoAxesCombined className="h-3.5 w-3.5" />
              Stream controls
            </div>
            <label className="mb-2 flex items-center justify-between text-xs text-slate-600">
              Chaos mode
              <input
                type="checkbox"
                checked={chaosMode}
                onChange={(event) => setChaosMode(event.target.checked)}
                className="h-4 w-4 accent-emerald-600"
              />
            </label>
            <label className="mb-2 block text-xs text-slate-600">
              Rate
              <select
                className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs"
                value={eventRate}
                onChange={(event) => setEventRate(event.target.value as EventRate)}
              >
                <option value="slow">Slow</option>
                <option value="normal">Normal</option>
                <option value="fast">Fast</option>
              </select>
            </label>
            <button
              onClick={handleSimulateDisconnect}
              className="mt-1 w-full rounded-md bg-slate-800 px-2 py-1.5 text-xs font-medium text-white hover:bg-slate-700"
            >
              Simulate disconnect
            </button>
          </div>

          <div className="mt-6 flex items-center gap-2 text-sm text-slate-500">
            <LogOut className="h-4 w-4" />
            Log out
          </div>
        </aside>

        <main className="p-5 lg:p-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="rounded-md border border-slate-200 bg-white px-2 py-1">
                Time period: Live
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-md px-2 py-1 font-medium ${
                  connection === "connected"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-rose-100 text-rose-700"
                }`}
              >
                {connection === "connected" ? (
                  <Wifi className="h-3.5 w-3.5" />
                ) : (
                  <WifiOff className="h-3.5 w-3.5" />
                )}
                {connection}
              </span>
            </div>
          </div>

          <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {cards.map((card) => {
              const Icon = card.icon;
              return (
                <article
                  key={card.label}
                  className="rounded-xl border border-slate-200 bg-white p-4"
                >
                  <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
                    <span>{card.label}</span>
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className="text-2xl font-semibold text-slate-900">{card.value}</p>
                  <p
                    className={`mt-1 text-xs font-medium ${
                      card.positive ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {card.positive ? "up" : "down"} {card.delta}
                  </p>
                </article>
              );
            })}
            <article className="grid place-content-center rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
              Add data
            </article>
          </section>

          <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
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
            <article className="rounded-xl border border-slate-200 bg-white p-4">
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

            <article className="rounded-xl border border-slate-200 bg-white p-4">
              <h2 className="mb-4 text-3xl font-semibold tracking-tight">Sales by countries</h2>
              <div className="space-y-2 text-sm">
                {countries.map((country) => (
                  <div key={country.name} className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="inline-flex items-center gap-2 text-slate-700">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                      {country.name}
                    </span>
                    <span className="font-semibold text-slate-800">{country.share}%</span>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
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

            <div className="mt-3 space-y-2 text-xs text-slate-600">
              {recentEvents.map((event) => (
                <div key={event.id} className="rounded-lg border border-slate-100 px-2.5 py-2">
                  <span className="font-medium text-slate-700">{event.type}</span>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}


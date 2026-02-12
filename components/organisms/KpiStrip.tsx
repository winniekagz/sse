"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlarmClock,
  AlertTriangle,
  BadgeDollarSign,
  PackageCheck,
  Truck,
} from "lucide-react";

import type { OrdersFilter } from "@/lib/filters/ordersFilter";
import type { KpiMetrics } from "@/lib/metrics/computeKpis";
import { KPI_THRESHOLDS } from "@/lib/metrics/thresholds";
import { cn } from "@/lib/utils";

type KpiStripProps = {
  metrics: KpiMetrics;
  onSelectFilter?: (filter: OrdersFilter) => void;
  isLoading?: boolean;
};

const formatMoney = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

const formatMinutes = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) return "0 min";
  if (value < 60) return `${Math.round(value)} min`;
  const hours = value / 60;
  return `${hours.toFixed(1)} hr`;
};

export function KpiStrip({ metrics, onSelectFilter, isLoading }: KpiStripProps) {
  const [stableMetrics, setStableMetrics] = useState(metrics);

  useEffect(() => {
    if (metrics.hasData) {
      setStableMetrics(metrics);
    }
  }, [metrics]);

  const cards = useMemo(
    () => [
      {
        id: "orders_today",
        label: "Orders today",
        value: stableMetrics.ordersToday.toLocaleString("en-US"),
        helper: "Local time",
        icon: PackageCheck,
      },
      {
        id: "revenue_today",
        label: "Revenue today",
        value: formatMoney(stableMetrics.revenueToday),
        helper: "Captured",
        icon: BadgeDollarSign,
      },
      {
        id: "failed_payments",
        label: "Failed payments",
        value: stableMetrics.failedPayments.toLocaleString("en-US"),
        helper: "Today",
        icon: AlertTriangle,
        onClick: () =>
          onSelectFilter?.({ id: "failed", label: "Failed payments" }),
        clickable: true,
      },
      {
        id: "at_risk",
        label: "At-risk shipments",
        value: stableMetrics.atRiskShipments.toLocaleString("en-US"),
        helper: "SLA risk",
        icon: Truck,
        onClick: () =>
          onSelectFilter?.({
            id: "shipping_at_risk",
            label: "At-risk shipments",
            thresholdMs: KPI_THRESHOLDS.shippingLateMs,
          }),
        clickable: true,
      },
      {
        id: "avg_time",
        label: "Avg time in state",
        value: formatMinutes(stableMetrics.avgStateMinutes),
        helper: "Today",
        icon: AlarmClock,
      },
    ],
    [onSelectFilter, stableMetrics],
  );

  return (
    <section className="grid gap-3 rounded-xl p-1 md:grid-cols-2 xl:grid-cols-5">
      {cards.map((card) => {
        const Icon = card.icon;
        const Element = card.clickable ? "button" : "div";
        return (
          <Element
            key={card.id}
            onClick={card.onClick}
            type={card.clickable ? "button" : undefined}
            className={cn(
              "rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm",
              card.clickable ? "cursor-pointer hover:border-emerald-200 hover:bg-emerald-50" : "",
            )}
          >
            <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
              <span>{card.label}</span>
              <Icon className="h-4 w-4" />
            </div>
            <p className="text-2xl font-semibold text-slate-900">
              {isLoading && !stableMetrics.hasData ? "—" : card.value}
            </p>
            <p className="mt-1 text-xs text-slate-500">{card.helper}</p>
          </Element>
        );
      })}
    </section>
  );
}

"use client";

import { KpiCard } from "@/components/molecules/KpiCard";

type KpiGridProps = {
  ordersPerMinute: number;
  successRate: number;
  avgOrderValue: number;
};

export function KpiGrid({
  ordersPerMinute,
  successRate,
  avgOrderValue,
}: KpiGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <KpiCard
        label="Orders / min"
        value={ordersPerMinute.toString()}
        helper="Rolling 60s window"
      />
      <KpiCard
        label="Payment success"
        value={`${Math.round(successRate * 100)}%`}
        helper="Authorized vs failed"
      />
      <KpiCard
        label="Avg order value"
        value={`$${avgOrderValue.toFixed(2)}`}
        helper="Recent created orders"
      />
    </div>
  );
}

"use client";

import { useMemo } from "react";
import { CheckCheck, Clock3, Package, PackageCheck, Truck } from "lucide-react";

import type { SimpleKpis } from "@/lib/domain/orders/selectors";
import type { OrdersFilter } from "@/lib/filters/ordersFilter";
import { cn } from "@/lib/utils";

type KpiStripProps = {
  metrics: SimpleKpis;
  onSelectFilter?: (filter: OrdersFilter) => void;
  isLoading?: boolean;
};

export function KpiStrip({ metrics, onSelectFilter, isLoading }: KpiStripProps) {
  const cards = useMemo(
    () => [
      {
        id: "total",
        label: "Total orders",
        value: metrics.total.toLocaleString("en-US"),
        helper: "All tracked",
        icon: Package,
        onClick: () => onSelectFilter?.({ id: "all", label: "All orders" }),
        clickable: true,
      },
      {
        id: "failed",
        label: "Failed",
        value: metrics.failed.toLocaleString("en-US"),
        helper: "Payment failures",
        icon: Clock3,
        onClick: () => onSelectFilter?.({ id: "failed", label: "Failed orders" }),
        clickable: true,
      },
      {
        id: "pending",
        label: "Pending",
        value: metrics.pending.toLocaleString("en-US"),
        helper: "Created/Paid/Picked",
        icon: PackageCheck,
        onClick: () => onSelectFilter?.({ id: "pending", label: "Pending orders" }),
        clickable: true,
      },
      {
        id: "shipped",
        label: "Shipped",
        value: metrics.shipped.toLocaleString("en-US"),
        helper: "In transit",
        icon: Truck,
        onClick: () => onSelectFilter?.({ id: "shipped", label: "Shipped orders" }),
        clickable: true,
      },
      {
        id: "delivered",
        label: "Delivered",
        value: metrics.delivered.toLocaleString("en-US"),
        helper: "Completed",
        icon: CheckCheck,
        onClick: () => onSelectFilter?.({ id: "delivered", label: "Delivered orders" }),
        clickable: true,
      },
    ],
    [metrics, onSelectFilter],
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
            <p className="text-2xl font-semibold text-slate-900">{isLoading ? "-" : card.value}</p>
            <p className="mt-1 text-xs text-slate-500">{card.helper}</p>
          </Element>
        );
      })}
    </section>
  );
}


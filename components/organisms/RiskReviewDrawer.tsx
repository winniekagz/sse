"use client";

import { useEffect, useMemo, useRef } from "react";
import { AlertCircle, AlertTriangle, CircleCheck, X } from "lucide-react";

import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/ui/button";
import type { ExceptionItem } from "@/lib/metrics/computeExceptions";
import type { OrderRow } from "@/lib/state/dashboardStore";
import { cn } from "@/lib/utils";

type RiskReviewDrawerProps = {
  open: boolean;
  items: ExceptionItem[];
  orders: OrderRow[];
  onClose: () => void;
  onInspectException?: (item: ExceptionItem) => void;
};

const severityRank: Record<ExceptionItem["severity"], number> = {
  danger: 3,
  warning: 2,
  info: 1,
};

const severityIcon = (severity: ExceptionItem["severity"]) => {
  if (severity === "danger") return AlertCircle;
  if (severity === "warning") return AlertTriangle;
  return CircleCheck;
};

const statusBadge = (status: OrderRow["status"]) => {
  if (status === "failed") return "danger";
  if (
    status === "delivered" ||
    status === "shipped" ||
    status === "authorized" ||
    status === "picked"
  ) {
    return "success";
  }
  if (status === "cancelled") return "outline";
  return "warning";
};

type QueueEntry = {
  item: ExceptionItem;
  impactedOrders: OrderRow[];
};

const formatTime = (value: number) =>
  new Date(value).toLocaleTimeString(undefined, {
    hour12: false,
    minute: "2-digit",
    second: "2-digit",
  });

export function RiskReviewDrawer({
  open,
  items,
  orders,
  onClose,
  onInspectException,
}: RiskReviewDrawerProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  const queue = useMemo<QueueEntry[]>(() => {
    const orderMap = new Map(orders.map((order) => [order.orderId, order]));
    return [...items]
      .sort((a, b) => severityRank[b.severity] - severityRank[a.severity])
      .map((item) => ({
        item,
        impactedOrders: item.orderIds
          .map((id) => orderMap.get(id))
          .filter((order): order is OrderRow => Boolean(order))
          .sort((a, b) => b.updatedAt - a.updatedAt),
      }));
  }, [items, orders]);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      if (!panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
      previous?.focus();
    };
  }, [onClose, open]);

  if (!open) return null;

  const dangerCount = queue.filter((entry) => entry.item.severity === "danger").length;
  const warningCount = queue.filter((entry) => entry.item.severity === "warning").length;

  return (
    <div className="fixed inset-0 z-50">
      <button aria-label="Close risk review drawer" onClick={onClose} className="absolute inset-0 bg-slate-900/40" />
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="risk-review-title"
        className={cn(
          "absolute right-0 top-0 h-full w-full max-w-2xl overflow-y-auto bg-white shadow-xl",
          "transition-transform",
        )}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Owner review</p>
            <h2 id="risk-review-title" className="text-lg font-semibold text-slate-900">
              Business Risk Watchlist
            </h2>
          </div>
          <Button
            ref={closeButtonRef}
            variant="outline"
            size="icon"
            onClick={onClose}
            className="border-slate-200"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
              Critical risks: <span className="font-semibold">{dangerCount}</span>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Warnings: <span className="font-semibold">{warningCount}</span>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              Total watch items: <span className="font-semibold">{queue.length}</span>
            </div>
          </div>

          <div className="space-y-3">
            {queue.map(({ item, impactedOrders }) => {
              const Icon = severityIcon(item.severity);
              return (
                <article key={item.id} className="rounded-xl border border-slate-200 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                      <Icon className="mt-0.5 h-4 w-4 text-slate-500" />
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                        {item.helper && <p className="text-xs text-slate-500">{item.helper}</p>}
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => onInspectException?.(item)}>
                      Open affected orders
                    </Button>
                  </div>

                  <div className="mt-3 space-y-2">
                    {impactedOrders.slice(0, 8).map((order) => (
                      <div key={order.orderId} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                        <div>
                          <p className="text-sm font-medium text-slate-800">{order.orderId}</p>
                          <p className="text-xs text-slate-500">
                            {order.customerId} | Updated {formatTime(order.updatedAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={statusBadge(order.status)}>{order.status}</Badge>
                          <span className="text-xs font-semibold text-slate-700">${order.amount.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                    {impactedOrders.length === 0 && (
                      <p className="rounded-lg border border-dashed border-slate-200 px-3 py-3 text-xs text-slate-500">
                        No impacted orders currently in the active view.
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </aside>
    </div>
  );
}


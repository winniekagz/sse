"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  CreditCard,
  Package,
  Truck,
  UserRound,
  X,
} from "lucide-react";

import { Badge } from "@/components/atoms/Badge";
import { OrderTimeline } from "@/components/organisms/OrderTimeline";
import { Button } from "@/components/ui/button";
import type { OrderEvent } from "@/lib/events";
import type { OrderRow } from "@/lib/state/dashboardStore";
import { cn } from "@/lib/utils";

type OrderDrawerProps = {
  open: boolean;
  order: OrderRow | null;
  events: OrderEvent[];
  onClose: () => void;
};

const statusVariant = (status: OrderRow["status"]) => {
  if (status === "authorized" || status === "picked" || status === "shipped" || status === "delivered") {
    return "success";
  }
  if (status === "failed") return "danger";
  return "warning";
};

const formatTime = (value: number) =>
  new Date(value).toLocaleTimeString(undefined, {
    hour12: false,
    minute: "2-digit",
    second: "2-digit",
  });

const issueTone = (issue: OrderRow["currentIssue"]) => {
  if (issue === "PAYMENT_FAILED") return "danger";
  if (issue === "SHIPPING_DELAY") return "warning";
  return "outline";
};

export function OrderDrawer({ open, order, events, onClose }: OrderDrawerProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const titleId = order ? `order-drawer-title-${order.orderId}` : "order-drawer-title";

  const timeline = useMemo(() => [...events], [events]);
  const lifecycleSteps = [
    { id: "created", label: "Created" },
    { id: "authorized", label: "Paid" },
    { id: "picked", label: "Picked" },
    { id: "shipped", label: "Shipped" },
    { id: "delivered", label: "Delivered" },
  ] as const;
  const currentStepIndex = lifecycleSteps.findIndex((step) => step.id === order?.status);

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

  if (!open || !order) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        aria-label="Close order drawer"
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40"
      />
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto bg-white shadow-xl",
          "transition-transform",
        )}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Order</p>
            <h2 id={titleId} className="text-lg font-semibold text-slate-900">
              {order.orderId}
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

        <div className="space-y-6 px-5 py-4">
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <div>
              <p className="text-xs text-slate-500">Status</p>
              <Badge variant={statusVariant(order.status)}>{order.status}</Badge>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Last updated</p>
              <p className="text-sm font-medium text-slate-800">{formatTime(order.updatedAt)}</p>
            </div>
          </div>

          {order.currentIssue && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="mb-1 text-xs text-slate-500">Current issue</p>
              <Badge variant={issueTone(order.currentIssue)}>{order.currentIssue}</Badge>
            </div>
          )}

          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-800">State stepper</h3>
            <div className="grid gap-2 md:grid-cols-5">
              {lifecycleSteps.map((step, index) => {
                const active = currentStepIndex >= 0 && index <= currentStepIndex;
                return (
                  <div
                    key={step.id}
                    className={cn(
                      "rounded-lg border px-2 py-2 text-center text-xs",
                      active
                        ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-slate-50 text-slate-500",
                    )}
                  >
                    {step.label}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-800">Event timeline</h3>
            <OrderTimeline events={timeline} />
          </section>

          <section className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-slate-200 p-3">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-slate-500">
                <UserRound className="h-4 w-4" />
                Customer
              </div>
              <p className="text-sm font-medium text-slate-800">{order.customerId}</p>
              <p className="text-xs text-slate-500">{order.country}</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-3">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-slate-500">
                <CreditCard className="h-4 w-4" />
                Payment
              </div>
              <p className="text-sm font-medium text-slate-800">
                ${order.amount.toFixed(2)} {order.currency}
              </p>
              <p className="text-xs text-slate-500">Status: {order.status}</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-3">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-slate-500">
                <Truck className="h-4 w-4" />
                Shipping
              </div>
              <p className="text-sm font-medium text-slate-800">
                {order.status === "delivered"
                  ? "Delivered"
                  : order.status === "shipped"
                    ? "In transit"
                    : order.status === "authorized" || order.status === "picked"
                      ? "Ready to ship"
                      : "Pending"}
              </p>
              <p className="text-xs text-slate-500">SLA monitored</p>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-800">Next actions</h3>
            <div className="grid gap-2 sm:grid-cols-3">
              <Button variant="outline" className="border-slate-200">
                <BadgeCheck className="h-4 w-4" />
                Retry payment
              </Button>
              <Button variant="outline" className="border-slate-200">
                <AlertTriangle className="h-4 w-4" />
                Contact customer
              </Button>
              <Button variant="outline" className="border-slate-200">
                <Package className="h-4 w-4" />
                Recreate shipment
              </Button>
            </div>
          </section>
        </div>
      </aside>
    </div>
  );
}

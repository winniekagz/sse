"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  Clock,
  CreditCard,
  Package,
  Truck,
  UserRound,
  X,
} from "lucide-react";

import { Badge } from "@/components/atoms/Badge";
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
  if (status === "authorized") return "success";
  if (status === "failed") return "danger";
  return "warning";
};

const formatTime = (value: number) =>
  new Date(value).toLocaleTimeString(undefined, {
    hour12: false,
    minute: "2-digit",
    second: "2-digit",
  });

const getEventTime = (event: OrderEvent) => {
  if (event.type === "order_created") return event.createdAt;
  if (event.type === "payment_authorized") return event.authorizedAt;
  return event.failedAt;
};

export function OrderDrawer({ open, order, events, onClose }: OrderDrawerProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const titleId = order ? `order-drawer-title-${order.orderId}` : "order-drawer-title";

  const timeline = useMemo(
    () =>
      [...events].sort(
        (a, b) => getEventTime(b) - getEventTime(a),
      ),
    [events],
  );

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

          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-800">Event timeline</h3>
            <div className="space-y-2">
              {timeline.map((event) => (
                <div key={event.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Clock className="h-4 w-4 text-slate-400" />
                    {event.type.replaceAll("_", " ")}
                  </div>
                  <span className="text-xs text-slate-500">
                    {formatTime(getEventTime(event))}
                  </span>
                </div>
              ))}
              {timeline.length === 0 && (
                <div className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-sm text-slate-500">
                  No recent events for this order.
                </div>
              )}
            </div>
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
                {order.status === "authorized" ? "Ready to ship" : "Pending"}
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

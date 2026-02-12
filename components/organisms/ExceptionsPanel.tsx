"use client";

import { AlertCircle, AlertTriangle, CircleCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ExceptionItem } from "@/lib/metrics/computeExceptions";
import { cn } from "@/lib/utils";

type ExceptionsPanelProps = {
  items: ExceptionItem[];
  onSelect: (item: ExceptionItem) => void;
};

const severityIcon = (severity: ExceptionItem["severity"]) => {
  if (severity === "danger") return AlertCircle;
  if (severity === "warning") return AlertTriangle;
  return CircleCheck;
};

const severityStyles: Record<ExceptionItem["severity"], string> = {
  info: "border-slate-200 bg-white text-slate-700",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  danger: "border-rose-200 bg-rose-50 text-rose-900",
};

export function ExceptionsPanel({ items, onSelect }: ExceptionsPanelProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">Exceptions</h2>
          <p className="text-xs text-slate-500">Actionable issues from live activity.</p>
        </div>
        <Button variant="outline" size="sm" className="border-slate-200">
          Review queue
        </Button>
      </div>

      <div className="space-y-2">
        {items.map((item) => {
          const Icon = severityIcon(item.severity);
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item)}
              className={cn(
                "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm hover:shadow-sm",
                severityStyles[item.severity],
              )}
            >
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <div>
                  <p className="font-medium">{item.title}</p>
                  {item.helper && <p className="text-xs opacity-70">{item.helper}</p>}
                </div>
              </div>
              <span className="text-xs font-semibold uppercase tracking-wide">Review</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

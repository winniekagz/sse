"use client";

import { Clock } from "lucide-react";

import type { OrderEvent } from "@/lib/events";

type OrderTimelineProps = {
  events: OrderEvent[];
  emptyLabel?: string;
};

const formatTime = (value: number) =>
  new Date(value).toLocaleTimeString(undefined, {
    hour12: false,
    minute: "2-digit",
    second: "2-digit",
  });

function eventTime(event: OrderEvent): number {
  if ("ts" in event && typeof event.ts === "number") return event.ts;
  if ("createdAt" in event) return event.createdAt;
  if ("authorizedAt" in event) return event.authorizedAt;
  if ("failedAt" in event) return event.failedAt;
  if ("pickedAt" in event) return event.pickedAt;
  if ("shippedAt" in event) return event.shippedAt;
  if ("deliveredAt" in event) return event.deliveredAt;
  return event.cancelledAt;
}

export function OrderTimeline({
  events,
  emptyLabel = "No recent events for this order.",
}: OrderTimelineProps) {
  const timeline = [...events].sort((a, b) => b.seq - a.seq || eventTime(b) - eventTime(a));

  return (
    <div className="space-y-2">
      {timeline.map((event) => (
        <div key={event.eventId} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm">
          <div className="flex items-center gap-2 text-slate-700">
            <Clock className="h-4 w-4 text-slate-400" />
            {event.type.replaceAll("_", " ")}
          </div>
          <span className="text-xs text-slate-500">{formatTime(eventTime(event))}</span>
        </div>
      ))}
      {timeline.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-sm text-slate-500">
          {emptyLabel}
        </div>
      )}
    </div>
  );
}


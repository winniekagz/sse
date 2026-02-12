"use client";

import type { StreamEvent } from "@/lib/events";
import { Badge } from "@/components/atoms/Badge";

const formatTime = (value: number) =>
  new Date(value).toLocaleTimeString(undefined, {
    hour12: false,
    minute: "2-digit",
    second: "2-digit",
  });

const getEventMeta = (event: StreamEvent) => {
  if (event.type === "order_created") {
    return `Order ${event.orderId} created`;
  }
  if (event.type === "payment_authorized") {
    return `Payment authorized for ${event.orderId}`;
  }
  if (event.type === "payment_failed") {
    return `Payment failed (${event.reason})`;
  }
  if (event.type === "order_picked") {
    return `Order picked for ${event.orderId}`;
  }
  if (event.type === "order_shipped") {
    return `Order shipped (${event.carrier})`;
  }
  if (event.type === "order_delivered") {
    return `Order delivered`;
  }
  if (event.type === "order_cancelled") {
    return `Order cancelled (${event.reason})`;
  }
  if (event.type === "stream_connected") {
    return "Stream connected";
  }
  if (event.type === "stream_disconnected") {
    return `Disconnected (${event.reason})`;
  }
  if (event.type === "stream_reconnecting") {
    return `Reconnect attempt ${event.attempt}`;
  }
  if (event.type === "stream_reconnected") {
    return "Stream reconnected";
  }
  return "Unknown event";
};

const badgeVariant = (event: StreamEvent) => {
  if (event.type === "payment_failed" || event.type === "stream_disconnected") {
    return "danger";
  }
  if (event.type === "order_delivered") return "success";
  if (event.type === "stream_reconnecting") return "warning";
  if (event.type === "payment_authorized") return "success";
  return "outline";
};

type EventLogItemProps = {
  event: StreamEvent;
};

export function EventLogItem({ event }: EventLogItemProps) {
  const time =
    "createdAt" in event
      ? event.createdAt
      : "authorizedAt" in event
        ? event.authorizedAt
        : "failedAt" in event
          ? event.failedAt
          : "pickedAt" in event
            ? event.pickedAt
            : "shippedAt" in event
              ? event.shippedAt
              : "deliveredAt" in event
                ? event.deliveredAt
                : "cancelledAt" in event
                  ? event.cancelledAt
                  : event.at;

  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-slate-100 bg-white px-3 py-2 text-xs">
      <div className="space-y-1">
        <p className="font-medium text-slate-800">{getEventMeta(event)}</p>
        <p className="text-slate-500">{formatTime(time)}</p>
      </div>
      <Badge variant={badgeVariant(event)}>{event.type}</Badge>
    </div>
  );
}

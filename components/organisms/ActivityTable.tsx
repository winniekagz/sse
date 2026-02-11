"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { StreamEvent } from "@/lib/events";

type ActivityTableProps = {
  events: StreamEvent[];
};

const formatTime = (value: number) =>
  new Date(value).toLocaleTimeString(undefined, {
    hour12: false,
    minute: "2-digit",
    second: "2-digit",
  });

function getEventTime(event: StreamEvent) {
  if ("at" in event) return event.at;
  if ("createdAt" in event) return event.createdAt;
  if ("authorizedAt" in event) return event.authorizedAt;
  return event.failedAt;
}

export function ActivityTable({ events }: ActivityTableProps) {
  const rows = events.slice(0, 20);

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-800">Activity</h2>
        <span className="text-xs text-slate-500">Latest 20</span>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50">
            <TableHead>Type</TableHead>
            <TableHead>Order</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Country</TableHead>
            <TableHead>Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((event) => (
            <TableRow key={event.id}>
              <TableCell className="font-medium text-slate-800">{event.type}</TableCell>
              <TableCell>{"orderId" in event ? event.orderId : "-"}</TableCell>
              <TableCell>{"customerId" in event ? event.customerId : "-"}</TableCell>
              <TableCell>{"country" in event ? event.country : "-"}</TableCell>
              <TableCell>{formatTime(getEventTime(event))}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLivePaginatedTable } from "@/lib/hooks/useLivePaginatedTable";
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
  const [pageSize, setPageSize] = useState(10);
  const { pageRows, page, totalPages, pendingCount, setPage, refresh } =
    useLivePaginatedTable({
      rows: events,
      getId: (row) => row.id,
      pageSize,
    });

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-800">Activity</h2>
        <label className="flex items-center gap-2 text-xs text-slate-500">
          Rows
          <select
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value));
              setPage(1);
            }}
            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </label>
      </div>
      {pendingCount > 0 && (
        <div className="flex items-center justify-between border-b border-emerald-100 bg-emerald-50 px-4 py-2 text-xs text-emerald-800">
          <span>Live updates paused. {pendingCount} new rows - Refresh</span>
          <Button size="sm" onClick={refresh}>
            Refresh
          </Button>
        </div>
      )}
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
          {pageRows.map((event) => (
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
      <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2 text-xs text-slate-600">
        <span>Page {page} of {totalPages}</span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page <= 1}
          >
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            disabled={page >= totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

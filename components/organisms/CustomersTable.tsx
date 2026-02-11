"use client";

import { useState } from "react";

import { Badge } from "@/components/atoms/Badge";
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
import type { CustomerRow } from "@/lib/state/dashboardStore";

type CustomersTableProps = {
  customers: CustomerRow[];
};

const statusVariant = (status: CustomerRow["lastStatus"]) => {
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

export function CustomersTable({ customers }: CustomersTableProps) {
  const [pageSize, setPageSize] = useState(10);
  const { pageRows, page, totalPages, pendingCount, setPage, refresh } =
    useLivePaginatedTable({
      rows: customers,
      getId: (row) => row.customerId,
      pageSize,
    });

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-800">Customers</h2>
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
            <TableHead>Customer</TableHead>
            <TableHead>Country</TableHead>
            <TableHead>Orders</TableHead>
            <TableHead>Spend</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last update</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageRows.map((customer) => (
            <TableRow key={customer.customerId}>
              <TableCell className="font-medium text-slate-800">{customer.customerId}</TableCell>
              <TableCell>{customer.country}</TableCell>
              <TableCell>{customer.orders}</TableCell>
              <TableCell>${customer.spend.toFixed(2)}</TableCell>
              <TableCell>
                <Badge variant={statusVariant(customer.lastStatus)}>
                  {customer.lastStatus}
                </Badge>
              </TableCell>
              <TableCell>{formatTime(customer.lastUpdatedAt)}</TableCell>
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

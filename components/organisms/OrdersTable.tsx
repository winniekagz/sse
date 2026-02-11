"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { useLivePaginatedTable } from "@/lib/hooks/useLivePaginatedTable";
import type { OrderRow } from "@/lib/state/dashboardStore";

type OrdersTableProps = {
  orders: OrderRow[];
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

export function OrdersTable({ orders }: OrdersTableProps) {
  const reduceMotion = useReducedMotion();
  const [pageSize, setPageSize] = useState(10);
  const { pageRows, page, totalPages, pendingCount, setPage, refresh } =
    useLivePaginatedTable({
      rows: orders,
      getId: (row) => row.orderId,
      pageSize,
    });

  return (
    <div
      className="rounded-xl border border-slate-200 bg-white"
      aria-live="polite"
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-800">Live Orders</h2>
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
            <TableHead>Order</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Country</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <AnimatePresence initial={false}>
            {pageRows.map((order) => (
              <motion.tr
                key={order.orderId}
                initial={reduceMotion ? false : { opacity: 0, y: -8 }}
                animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 4 }}
                transition={{ duration: 0.2 }}
                className="border-b border-slate-100"
              >
                <TableCell className="font-medium text-slate-800">
                  {order.orderId}
                </TableCell>
                <TableCell>{order.customerId}</TableCell>
                <TableCell>{order.country}</TableCell>
                <TableCell>{order.category}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant(order.status)}>
                    {order.status}
                  </Badge>
                </TableCell>
                <TableCell>${order.amount.toFixed(2)}</TableCell>
                <TableCell>{formatTime(order.createdAt)}</TableCell>
                <TableCell>{formatTime(order.updatedAt)}</TableCell>
              </motion.tr>
            ))}
          </AnimatePresence>
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

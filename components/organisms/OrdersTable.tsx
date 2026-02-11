"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { Badge } from "@/components/atoms/Badge";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from "@/components/ui/table";
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

  return (
    <div
      className="rounded-xl border border-slate-200 bg-white"
      aria-live="polite"
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-800">Live Orders</h2>
        <span className="text-xs text-slate-500">Latest 50</span>
      </div>
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
            {orders.map((order) => (
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
    </div>
  );
}

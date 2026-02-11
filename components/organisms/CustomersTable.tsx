"use client";

import { Badge } from "@/components/atoms/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-800">Customers</h2>
        <span className="text-xs text-slate-500">Latest 25</span>
      </div>
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
          {customers.map((customer) => (
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
    </div>
  );
}

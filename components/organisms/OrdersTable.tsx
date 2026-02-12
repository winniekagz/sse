"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/atoms/Badge";
import { DataTable } from "@/components/organisms/DataTable";
import { useLiveTableData } from "@/lib/hooks/useLiveTableData";
import type { OrderRow } from "@/lib/state/dashboardStore";

type OrdersTableProps = {
  orders: OrderRow[];
  filterLabel?: string;
  onClearFilter?: () => void;
  onRowClick?: (order: OrderRow) => void;
};

const statusVariant = (status: OrderRow["status"]) => {
  if (status === "authorized" || status === "picked" || status === "shipped" || status === "delivered") return "success";
  if (status === "cancelled") return "outline";
  if (status === "failed") return "danger";
  return "warning";
};

const formatTime = (value: number) =>
  new Date(value).toLocaleTimeString(undefined, {
    hour12: false,
    minute: "2-digit",
    second: "2-digit",
  });

export function OrdersTable({ orders, filterLabel, onClearFilter, onRowClick }: OrdersTableProps) {
  const { activeRows, pendingCount, refresh } = useLiveTableData({
    rows: orders,
    getId: (row) => row.orderId,
  });

  const columns = useMemo<ColumnDef<OrderRow, unknown>[]>(
    () => [
      {
        header: "Order",
        accessorKey: "orderId",
        cell: ({ row }) => (
          <span className="font-medium text-slate-800">{row.original.orderId}</span>
        ),
      },
      { header: "Customer", accessorKey: "customerId" },
      { header: "Country", accessorKey: "country" },
      { header: "Category", accessorKey: "category" },
      {
        header: "Status",
        accessorKey: "status",
        cell: ({ row }) => (
          <Badge variant={statusVariant(row.original.status)}>
            {row.original.status}
          </Badge>
        ),
      },
      {
        header: "Amount",
        accessorKey: "amount",
        cell: ({ row }) => `$${row.original.amount.toFixed(2)}`,
      },
      {
        header: "Created",
        accessorKey: "createdAt",
        cell: ({ row }) => formatTime(row.original.createdAt),
      },
      {
        header: "Updated",
        accessorKey: "updatedAt",
        cell: ({ row }) => formatTime(row.original.updatedAt),
      },
    ],
    [],
  );

  return (
    <DataTable
      title="Live Orders"
      data={activeRows}
      columns={columns}
      getRowId={(row) => row.orderId}
      pendingCount={pendingCount}
      onRefresh={refresh}
      onRowClick={onRowClick}
      ariaLive="polite"
      headerRight={
        filterLabel ? (
          <button
            onClick={onClearFilter}
            className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100"
          >
            {filterLabel} · Clear
          </button>
        ) : null
      }
    />
  );
}

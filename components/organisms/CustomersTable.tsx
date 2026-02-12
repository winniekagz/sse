"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/atoms/Badge";
import { DataTable } from "@/components/organisms/DataTable";
import { useLiveTableData } from "@/lib/hooks/useLiveTableData";
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
  const { activeRows, pendingCount, refresh } = useLiveTableData({
    rows: customers,
    getId: (row) => row.customerId,
  });

  const columns = useMemo<ColumnDef<CustomerRow, unknown>[]>(
    () => [
      {
        header: "Customer",
        accessorKey: "customerId",
        cell: ({ row }) => (
          <span className="font-medium text-slate-800">{row.original.customerId}</span>
        ),
      },
      { header: "Country", accessorKey: "country" },
      { header: "Orders", accessorKey: "orders" },
      {
        header: "Spend",
        accessorKey: "spend",
        cell: ({ row }) => `$${row.original.spend.toFixed(2)}`,
      },
      {
        header: "Status",
        accessorKey: "lastStatus",
        cell: ({ row }) => (
          <Badge variant={statusVariant(row.original.lastStatus)}>
            {row.original.lastStatus}
          </Badge>
        ),
      },
      {
        header: "Last update",
        accessorKey: "lastUpdatedAt",
        cell: ({ row }) => formatTime(row.original.lastUpdatedAt),
      },
    ],
    [],
  );

  return (
    <DataTable
      title="Customers"
      data={activeRows}
      columns={columns}
      getRowId={(row) => row.customerId}
      pendingCount={pendingCount}
      onRefresh={refresh}
    />
  );
}

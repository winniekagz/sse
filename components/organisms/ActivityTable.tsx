"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/organisms/DataTable";
import { useLiveTableData } from "@/lib/hooks/useLiveTableData";
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
  return event.ts;
}

export function ActivityTable({ events }: ActivityTableProps) {
  const { activeRows, pendingCount, refresh } = useLiveTableData({
    rows: events,
    getId: (row) => row.id,
  });

  const columns = useMemo<ColumnDef<StreamEvent, unknown>[]>(
    () => [
      {
        header: "Type",
        accessorKey: "type",
        cell: ({ row }) => (
          <span className="font-medium text-slate-800">{row.original.type}</span>
        ),
      },
      {
        header: "Order",
        cell: ({ row }) => ("orderId" in row.original ? row.original.orderId : "-"),
      },
      {
        header: "Customer",
        cell: ({ row }) =>
          "customerId" in row.original ? row.original.customerId : "-",
      },
      {
        header: "Country",
        cell: ({ row }) => ("country" in row.original ? row.original.country : "-"),
      },
      {
        header: "Time",
        cell: ({ row }) => formatTime(getEventTime(row.original)),
      },
    ],
    [],
  );

  return (
    <DataTable
      title="Activity"
      data={activeRows}
      columns={columns}
      getRowId={(row) => row.id}
      pendingCount={pendingCount}
      onRefresh={refresh}
    />
  );
}

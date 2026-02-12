"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type DataTableProps<T> = {
  title: string;
  data: T[];
  columns: ColumnDef<T, unknown>[];
  getRowId: (row: T) => string;
  pageSizeOptions?: number[];
  defaultPageSize?: number;
  pendingCount?: number;
  onRefresh?: () => void;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  headerRight?: ReactNode;
  ariaLive?: "polite" | "off" | "assertive";
  className?: string;
};

export function DataTable<T>({
  title,
  data,
  columns,
  getRowId,
  pageSizeOptions = [10, 25, 50],
  defaultPageSize = 10,
  pendingCount = 0,
  onRefresh,
  emptyMessage = "No rows to show yet.",
  onRowClick,
  headerRight,
  ariaLive = "off",
  className,
}: DataTableProps<T>) {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: defaultPageSize,
  });

  const table = useReactTable({
    data,
    columns,
    getRowId,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const pageCount = table.getPageCount();
  const currentPage = pageCount ? pagination.pageIndex + 1 : 1;

  const pageSize = pagination.pageSize;
  const pageSizeOptionsValue = useMemo(() => {
    const set = new Set(pageSizeOptions);
    set.add(pageSize);
    return Array.from(set).sort((a, b) => a - b);
  }, [pageSize, pageSizeOptions]);

  return (
    <div
      className={cn("rounded-xl border border-slate-200 bg-white", className)}
      aria-live={ariaLive}
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
        <div className="flex items-center gap-3">
          {headerRight}
          <label className="flex items-center gap-2 text-xs text-slate-500">
            Rows
            <select
              value={pageSize}
              onChange={(event) =>
                table.setPageSize(Number(event.target.value))
              }
              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700"
            >
              {pageSizeOptionsValue.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {pendingCount > 0 && onRefresh && (
        <div className="flex items-center justify-between border-b border-emerald-100 bg-emerald-50 px-4 py-2 text-xs text-emerald-800">
          <span>Live updates paused. {pendingCount} new rows - Refresh</span>
          <Button size="sm" onClick={onRefresh}>
            Refresh
          </Button>
        </div>
      )}

      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="bg-slate-50">
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              onClick={onRowClick ? () => onRowClick(row.original) : undefined}
              className={cn(
                onRowClick ? "cursor-pointer" : undefined,
                "border-b border-slate-100",
              )}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
          {table.getRowModel().rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={columns.length} className="py-6 text-center text-sm text-slate-500">
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2 text-xs text-slate-600">
        <span>
          Page {currentPage} of {pageCount || 1}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useCallback, useMemo, useState } from "react";

type UseLivePaginatedTableOptions<T> = {
  rows: T[];
  getId: (row: T) => string;
  pageSize: number;
};

export function useLivePaginatedTable<T>({
  rows,
  getId,
  pageSize,
}: UseLivePaginatedTableOptions<T>) {
  const [snapshotRows, setSnapshotRows] = useState<T[]>(rows);
  const [page, setPage] = useState(1);
  const pendingCount = useMemo(() => {
    const snapshotIds = new Set(snapshotRows.map((row) => getId(row)));
    return rows.reduce(
      (count, row) => (snapshotIds.has(getId(row)) ? count : count + 1),
      0,
    );
  }, [getId, rows, snapshotRows]);

  const activeRows = pendingCount > 0 ? snapshotRows : rows;
  const totalPages = Math.max(1, Math.ceil(activeRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);

  const pageRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return activeRows.slice(start, start + pageSize);
  }, [activeRows, currentPage, pageSize]);

  const refresh = useCallback(() => {
    setSnapshotRows(rows);
    setPage(1);
  }, [rows]);

  const goToPage = useCallback(
    (value: number | ((current: number) => number)) => {
      setPage((current) => {
        const next =
          typeof value === "function"
            ? (value as (current: number) => number)(current)
            : value;
        return Math.max(1, Math.min(totalPages, next));
      });
    },
    [totalPages],
  );

  return {
    pageRows,
    page: currentPage,
    totalPages,
    pendingCount,
    setPage: goToPage,
    refresh,
  };
}

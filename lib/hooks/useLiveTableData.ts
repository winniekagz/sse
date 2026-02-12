"use client";

import { useCallback, useMemo, useState } from "react";

type UseLiveTableDataOptions<T> = {
  rows: T[];
  getId: (row: T) => string;
};

export function useLiveTableData<T>({ rows, getId }: UseLiveTableDataOptions<T>) {
  const [snapshotRows, setSnapshotRows] = useState<T[]>(rows);

  const pendingCount = useMemo(() => {
    const snapshotIds = new Set(snapshotRows.map((row) => getId(row)));
    return rows.reduce(
      (count, row) => (snapshotIds.has(getId(row)) ? count : count + 1),
      0,
    );
  }, [getId, rows, snapshotRows]);

  const activeRows = pendingCount > 0 ? snapshotRows : rows;

  const refresh = useCallback(() => {
    setSnapshotRows(rows);
  }, [rows]);

  return {
    activeRows,
    pendingCount,
    refresh,
  };
}

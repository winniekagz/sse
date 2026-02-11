"use client";

import { Search, Wifi, WifiOff } from "lucide-react";

import type { ConnectionStatus } from "@/lib/state/dashboardStore";

type DashboardTopNavProps = {
  query: string;
  connection: ConnectionStatus;
  onQueryChange: (value: string) => void;
};

export function DashboardTopNav({
  query,
  connection,
  onQueryChange,
}: DashboardTopNavProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
      <div className="flex w-full flex-wrap items-center justify-end gap-3 lg:w-auto">
        <div className="relative w-full max-w-sm lg:w-[340px]">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search order, activity, customer, country..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-emerald-300"
          />
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="rounded-md border border-slate-200 bg-white px-2 py-1">
            Time period: Live
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 font-medium ${
              connection === "connected"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-rose-100 text-rose-700"
            }`}
          >
            {connection === "connected" ? (
              <Wifi className="h-3.5 w-3.5" />
            ) : (
              <WifiOff className="h-3.5 w-3.5" />
            )}
            {connection}
          </span>
        </div>
      </div>
    </div>
  );
}

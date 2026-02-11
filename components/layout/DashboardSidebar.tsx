"use client";

import type { LucideIcon } from "lucide-react";
import { Activity, ChartNoAxesCombined, LogOut } from "lucide-react";

import type { EventRate } from "@/lib/stream/fakeSse";

export type SidebarMenuItem = {
  label: string;
  icon: LucideIcon;
  active?: boolean;
};

type DashboardSidebarProps = {
  menuItems: SidebarMenuItem[];
  chaosMode: boolean;
  eventRate: EventRate;
  onChaosModeChange: (value: boolean) => void;
  onEventRateChange: (value: EventRate) => void;
  onSimulateDisconnect: () => void;
};

export function DashboardSidebar({
  menuItems,
  chaosMode,
  eventRate,
  onChaosModeChange,
  onEventRateChange,
  onSimulateDisconnect,
}: DashboardSidebarProps) {
  return (
    <>
      <div className="mb-8 flex items-center gap-2 text-xl font-semibold text-[#145f47]">
        <Activity className="h-5 w-5" />
        Flup
      </div>

      <div className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm ${
                item.active
                  ? "bg-[#d9ebe3] font-semibold text-[#145f47]"
                  : "text-slate-600 hover:bg-[#e5efeb]"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="mt-10 rounded-xl border border-slate-200 bg-white p-3">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <ChartNoAxesCombined className="h-3.5 w-3.5" />
          Stream controls
        </div>
        <label className="mb-2 flex items-center justify-between text-xs text-slate-600">
          Chaos mode
          <input
            type="checkbox"
            checked={chaosMode}
            onChange={(event) => onChaosModeChange(event.target.checked)}
            className="h-4 w-4 accent-emerald-600"
          />
        </label>
        <label className="mb-2 block text-xs text-slate-600">
          Rate
          <select
            className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs"
            value={eventRate}
            onChange={(event) => onEventRateChange(event.target.value as EventRate)}
          >
            <option value="slow">Slow</option>
            <option value="normal">Normal</option>
            <option value="fast">Fast</option>
          </select>
        </label>
        <button
          onClick={onSimulateDisconnect}
          className="mt-1 w-full rounded-md bg-slate-800 px-2 py-1.5 text-xs font-medium text-white hover:bg-slate-700"
        >
          Simulate disconnect
        </button>
      </div>

      <div className="mt-6 flex items-center gap-2 text-sm text-slate-500">
        <LogOut className="h-4 w-4" />
        Log out
      </div>
    </>
  );
}

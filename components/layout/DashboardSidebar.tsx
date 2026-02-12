"use client";

import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ChartNoAxesCombined,
  ChevronDown,
  LogOut,
  PlugZap,
  Waves,
} from "lucide-react";

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
  const [mode, setMode] = useState<"business" | "demo">("business");

  const trafficMode = useMemo(() => {
    if (chaosMode) return "chaos";
    if (eventRate === "fast") return "peak";
    return "normal";
  }, [chaosMode, eventRate]);

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
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <ChartNoAxesCombined className="h-3.5 w-3.5" />
            Ops controls
          </div>
          <div className="flex rounded-full bg-slate-100 p-0.5 text-[11px] font-semibold text-slate-600">
            <button
              onClick={() => setMode("business")}
              className={`rounded-full px-2 py-1 ${mode === "business" ? "bg-white text-slate-900 shadow-sm" : ""}`}
            >
              Business
            </button>
            <button
              onClick={() => setMode("demo")}
              className={`rounded-full px-2 py-1 ${mode === "demo" ? "bg-white text-slate-900 shadow-sm" : ""}`}
            >
              Developer
            </button>
          </div>
        </div>

        {mode === "business" && (
          <div className="space-y-3">
            <label className="block text-xs text-slate-600">
              Traffic mode
              <select
                className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs"
                value={trafficMode}
                onChange={(event) => {
                  const value = event.target.value;
                  if (value === "normal") {
                    onChaosModeChange(false);
                    onEventRateChange("normal");
                  }
                  if (value === "peak") {
                    onChaosModeChange(false);
                    onEventRateChange("fast");
                  }
                  if (value === "chaos") {
                    onChaosModeChange(true);
                    onEventRateChange("fast");
                  }
                }}
              >
                <option value="normal">Normal</option>
                <option value="peak">Peak</option>
                <option value="chaos">Chaos</option>
              </select>
            </label>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Incident simulation
              </p>
              <div className="grid gap-2">
                <button
                  onClick={onSimulateDisconnect}
                  className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  aria-label="Simulate stream disconnect"
                >
                  Disconnect
                  <PlugZap className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => onChaosModeChange(!chaosMode)}
                  className={`flex items-center justify-between rounded-md border px-2 py-1.5 text-xs font-medium ${
                    chaosMode
                      ? "border-amber-200 bg-amber-50 text-amber-900"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  Jitter
                  <Waves className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => onChaosModeChange(!chaosMode)}
                  className={`flex items-center justify-between rounded-md border px-2 py-1.5 text-xs font-medium ${
                    chaosMode
                      ? "border-amber-200 bg-amber-50 text-amber-900"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  Duplicate events
                  <Waves className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <details className="rounded-md border border-slate-200 p-2 text-xs text-slate-600">
              <summary className="flex cursor-pointer items-center justify-between font-semibold text-slate-700">
                Advanced
                <ChevronDown className="h-3.5 w-3.5" />
              </summary>
              <div className="mt-2 space-y-2">
                <label className="flex items-center justify-between text-xs text-slate-600">
                  Chaos mode
                  <input
                    type="checkbox"
                    checked={chaosMode}
                    onChange={(event) => onChaosModeChange(event.target.checked)}
                    className="h-4 w-4 accent-emerald-600"
                  />
                </label>
                <label className="block text-xs text-slate-600">
                  Rate
                  <select
                    className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs"
                    value={eventRate}
                    onChange={(event) =>
                      onEventRateChange(event.target.value as EventRate)
                    }
                  >
                    <option value="slow">Slow</option>
                    <option value="normal">Normal</option>
                    <option value="fast">Fast</option>
                  </select>
                </label>
              </div>
            </details>
          </div>
        )}

        {mode === "demo" && (
          <div className="space-y-2">
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
              aria-label="Simulate stream disconnect"
            >
              Simulate disconnect
            </button>
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center gap-2 text-sm text-slate-500">
        <LogOut className="h-4 w-4" />
        Log out
      </div>
    </>
  );
}

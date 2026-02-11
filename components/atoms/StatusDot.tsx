"use client";

import { cn } from "@/lib/utils";
import type { ConnectionStatus } from "@/lib/state/dashboardReducer";

const STATUS_STYLES: Record<ConnectionStatus, string> = {
  connecting: "bg-amber-400",
  connected: "bg-emerald-500",
  reconnecting: "bg-amber-500",
  offline: "bg-rose-500",
};

type StatusDotProps = {
  status: ConnectionStatus;
  label?: string;
};

export function StatusDot({ status, label }: StatusDotProps) {
  return (
    <span
      role="status"
      aria-label={label ?? status}
      className={cn(
        "inline-flex h-2.5 w-2.5 rounded-full shadow-[0_0_0_3px_rgba(15,23,42,0.08)]",
        STATUS_STYLES[status],
      )}
    />
  );
}

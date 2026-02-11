"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { StatusDot } from "@/components/atoms/StatusDot";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { ConnectionStatus } from "@/lib/state/dashboardReducer";

type ConnectionBannerProps = {
  status: ConnectionStatus;
  lastUpdatedAt: number | null;
  onDisconnect: () => void;
};

const statusCopy: Record<ConnectionStatus, string> = {
  connecting: "Connecting",
  connected: "Connected",
  reconnecting: "Reconnecting",
  offline: "Offline",
};

const statusDetail: Record<ConnectionStatus, string> = {
  connecting: "Waiting for stream handshake",
  connected: "Live events flowing",
  reconnecting: "Attempting to restore the stream",
  offline: "Stream is currently offline",
};

const formatTime = (value: number) =>
  new Date(value).toLocaleTimeString(undefined, {
    hour12: false,
    minute: "2-digit",
    second: "2-digit",
  });

export function ConnectionBanner({
  status,
  lastUpdatedAt,
  onDisconnect,
}: ConnectionBannerProps) {
  const reduceMotion = useReducedMotion();
  return (
    <TooltipProvider>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex items-center gap-2">
                <StatusDot status={status} />
                <span className="text-sm font-semibold text-slate-900">
                  {statusCopy[status]}
                </span>
              </span>
            </TooltipTrigger>
            <TooltipContent>{statusDetail[status]}</TooltipContent>
          </Tooltip>
          <span className="text-xs text-slate-500">
            Last update:{" "}
            {lastUpdatedAt ? formatTime(lastUpdatedAt) : "awaiting events"}
          </span>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={status}
            initial={reduceMotion ? false : { opacity: 0, y: -6 }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
            transition={{ duration: 0.2 }}
          >
            <Button
              variant="outline"
              className="border-slate-200 text-slate-700"
              onClick={onDisconnect}
            >
              Simulate Disconnect
            </Button>
          </motion.div>
        </AnimatePresence>
      </div>
    </TooltipProvider>
  );
}

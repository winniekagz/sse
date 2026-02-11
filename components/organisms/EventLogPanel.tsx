"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EventLogItem } from "@/components/molecules/EventLogItem";
import type { StreamEvent } from "@/lib/events";

type EventLogPanelProps = {
  events: StreamEvent[];
};

export function EventLogPanel({ events }: EventLogPanelProps) {
  return (
    <Card className="border-slate-200">
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="text-sm text-slate-700">Event Log</CardTitle>
        <span className="text-xs text-slate-500">Latest 100</span>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="max-h-[480px] space-y-2 overflow-auto pr-1">
          {events.length === 0 ? (
            <p className="text-xs text-slate-500">Waiting for events...</p>
          ) : (
            events.map((event) => <EventLogItem key={event.id} event={event} />)
          )}
        </div>
      </CardContent>
    </Card>
  );
}

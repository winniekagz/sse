"use client";

import { AlertTriangle, PlugZap } from "lucide-react";

import { MiniStat } from "@/components/molecules/MiniStat";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { EventRate } from "@/lib/stream/fakeSse";

type DemoControlsProps = {
  chaosMode: boolean;
  eventRate: EventRate;
  flushIntervalMs: number;
  onChaosModeChange: (value: boolean) => void;
  onEventRateChange: (value: EventRate) => void;
  onSimulateDisconnect: () => void;
};

export function DemoControls({
  chaosMode,
  eventRate,
  flushIntervalMs,
  onChaosModeChange,
  onEventRateChange,
  onSimulateDisconnect,
}: DemoControlsProps) {
  return (
    <Card className="border-slate-200">
      <CardHeader className="space-y-1">
        <CardTitle className="text-sm text-slate-700">Demo Controls</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <MiniStat label="Chaos mode" value={chaosMode ? "ON" : "OFF"} />
          <Button
            variant={chaosMode ? "default" : "outline"}
            size="sm"
            onClick={() => onChaosModeChange(!chaosMode)}
            aria-pressed={chaosMode}
            aria-label="Toggle chaos mode"
          >
            <AlertTriangle className="h-4 w-4" />
            {chaosMode ? "Disable" : "Enable"}
          </Button>
        </div>

        <div className="space-y-2">
          <MiniStat label="Event rate" value={eventRate} />
          <Tabs
            value={eventRate}
            onValueChange={(value) => onEventRateChange(value as EventRate)}
          >
            <TabsList className="w-full justify-between">
              <TabsTrigger value="slow" className="flex-1">
                Slow
              </TabsTrigger>
              <TabsTrigger value="normal" className="flex-1">
                Normal
              </TabsTrigger>
              <TabsTrigger value="fast" className="flex-1">
                Fast
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <MiniStat label="Buffer flush" value={`${flushIntervalMs} ms`} />
          <Badge variant="outline">Max 5 FPS</Badge>
        </div>

        <Button
          variant="outline"
          className="w-full border-slate-200"
          onClick={onSimulateDisconnect}
          aria-label="Simulate stream disconnect"
        >
          <PlugZap className="h-4 w-4" />
          Simulate Disconnect
        </Button>
      </CardContent>
    </Card>
  );
}

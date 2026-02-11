import type { StreamEvent } from "@/lib/events";

type BufferOptions = {
  flushIntervalMs: number;
  onFlush: (events: StreamEvent[]) => void;
};

export function createEventBuffer({ flushIntervalMs, onFlush }: BufferOptions) {
  let buffer: StreamEvent[] = [];
  let timer: ReturnType<typeof setInterval> | null = null;
  let intervalMs = Math.max(200, flushIntervalMs);

  const flush = () => {
    if (buffer.length === 0) return;
    const next = buffer;
    buffer = [];
    onFlush(next);
  };

  const start = () => {
    if (timer) return;
    timer = setInterval(flush, intervalMs);
  };

  const stop = () => {
    if (!timer) return;
    clearInterval(timer);
    timer = null;
  };

  const push = (event: StreamEvent) => {
    buffer.push(event);
  };

  const setFlushInterval = (ms: number) => {
    intervalMs = Math.max(200, ms);
    if (timer) {
      stop();
      start();
    }
  };

  return { push, flush, start, stop, setFlushInterval };
}

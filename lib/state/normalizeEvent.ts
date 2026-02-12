import type { StreamEvent } from "@/lib/events";

type EventWithOptionalEnvelope = StreamEvent & {
  id?: string;
  eventId?: string;
  ts?: number;
  seq?: number;
};

export function getEventTimestamp(event: StreamEvent): number {
  if ("ts" in event && typeof event.ts === "number") return event.ts;
  if ("at" in event) return event.at;
  if ("createdAt" in event) return event.createdAt;
  if ("authorizedAt" in event) return event.authorizedAt;
  if ("failedAt" in event) return event.failedAt;
  if ("pickedAt" in event) return event.pickedAt;
  if ("shippedAt" in event) return event.shippedAt;
  if ("deliveredAt" in event) return event.deliveredAt;
  if ("cancelledAt" in event) return event.cancelledAt;
  return Date.now();
}

function fallbackId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `evt_${Math.random().toString(36).slice(2, 12)}`;
}

export function normalizeEventEnvelope(
  event: EventWithOptionalEnvelope,
  nextSeq: number,
): StreamEvent {
  const eventId = event.eventId ?? event.id ?? fallbackId();
  const ts = typeof event.ts === "number" ? event.ts : getEventTimestamp(event);
  const seq = typeof event.seq === "number" && event.seq > 0 ? event.seq : nextSeq;
  return {
    ...event,
    id: event.id ?? eventId,
    eventId,
    ts,
    seq,
  };
}

export function normalizeEventBatch(
  events: StreamEvent[],
  startingSeq: number,
): { events: StreamEvent[]; lastSeq: number } {
  let seq = startingSeq;
  const normalized = events.map((event) => {
    const normalizedEvent = normalizeEventEnvelope(event, seq + 1);
    seq = Math.max(seq + 1, normalizedEvent.seq);
    return normalizedEvent;
  });
  return { events: normalized, lastSeq: seq };
}


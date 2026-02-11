import type {
  OrderCreatedEvent,
  PaymentAuthorizedEvent,
  PaymentFailedEvent,
  StreamEvent,
  StreamReconnectedEvent,
  StreamReconnectingEvent,
  StreamDisconnectedEvent,
  StreamConnectedEvent,
} from "@/lib/events";

export type EventRate = "slow" | "normal" | "fast";

type Listener = (event: StreamEvent) => void;

type FakeSseOptions = {
  chaosMode?: boolean;
  eventRate?: EventRate;
};

const RATE_MS: Record<EventRate, [number, number]> = {
  slow: [900, 1600],
  normal: [500, 1200],
  fast: [250, 600],
};

const PAYMENT_DELAY_MS: [number, number] = [300, 1200];

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `evt_${Math.random().toString(36).slice(2, 10)}`;
}

export function createFakeSse(options: FakeSseOptions = {}) {
  let chaosMode = options.chaosMode ?? false;
  let eventRate: EventRate = options.eventRate ?? "normal";
  let connected = true;

  let orderTimer: ReturnType<typeof setTimeout> | null = null;
  let disconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  const listeners = new Set<Listener>();

  const emitNow = (event: StreamEvent) => {
    listeners.forEach((listener) => listener(event));
  };

  const emit = (event: StreamEvent) => {
    if (!chaosMode) {
      emitNow(event);
      return;
    }

    const dupChance = Math.random();
    const delayChance = Math.random();

    if (delayChance < 0.12) {
      const delay = rand(120, 900);
      setTimeout(() => emitNow(event), delay);
    } else {
      emitNow(event);
    }

    if (dupChance < 0.08) {
      const delay = rand(40, 240);
      setTimeout(() => emitNow(event), delay);
    }
  };

  const emitConnected = () => {
    const event: StreamConnectedEvent = {
      id: createId(),
      type: "stream_connected",
      at: Date.now(),
    };
    emit(event);
  };

  const emitDisconnected = (reason: StreamDisconnectedEvent["reason"]) => {
    const event: StreamDisconnectedEvent = {
      id: createId(),
      type: "stream_disconnected",
      at: Date.now(),
      reason,
    };
    emit(event);
  };

  const emitReconnecting = (attempt: number) => {
    const event: StreamReconnectingEvent = {
      id: createId(),
      type: "stream_reconnecting",
      at: Date.now(),
      attempt,
    };
    emit(event);
  };

  const emitReconnected = () => {
    const event: StreamReconnectedEvent = {
      id: createId(),
      type: "stream_reconnected",
      at: Date.now(),
    };
    emit(event);
  };

  const scheduleNextOrder = () => {
    if (!connected) return;
    const [minMs, maxMs] = RATE_MS[eventRate];
    orderTimer = setTimeout(() => {
      if (!connected) return;
      const now = Date.now();
      const orderId = `ord_${now.toString(36)}_${rand(10, 99)}`;
      const created: OrderCreatedEvent = {
        id: createId(),
        type: "order_created",
        orderId,
        amount: rand(18, 160) + Math.random(),
        currency: "USD",
        createdAt: now,
      };
      const emitCreated = () => emit(created);

      const outcomeDelay = rand(PAYMENT_DELAY_MS[0], PAYMENT_DELAY_MS[1]);
      const outOfOrder = chaosMode && Math.random() < 0.12;

      if (outOfOrder) {
        setTimeout(emitCreated, rand(350, 1300));
      } else {
        emitCreated();
      }

      setTimeout(() => {
        if (!connected) return;
        const ok = Math.random() < 0.85;
        if (ok) {
          const authorized: PaymentAuthorizedEvent = {
            id: createId(),
            type: "payment_authorized",
            orderId,
            authorizedAt: Date.now(),
          };
          emit(authorized);
        } else {
          const failed: PaymentFailedEvent = {
            id: createId(),
            type: "payment_failed",
            orderId,
            failedAt: Date.now(),
            reason: ["insufficient_funds", "card_expired", "network_error"][
              rand(0, 2)
            ] as PaymentFailedEvent["reason"],
          };
          emit(failed);
        }
      }, outcomeDelay);

      scheduleNextOrder();
    }, rand(minMs, maxMs));
  };

  const scheduleDisconnectCycle = () => {
    const delay = rand(25_000, 45_000);
    disconnectTimer = setTimeout(() => {
      triggerDisconnect("network");
    }, delay);
  };

  const triggerDisconnect = (reason: StreamDisconnectedEvent["reason"]) => {
    if (!connected) return;
    connected = false;
    if (orderTimer) clearTimeout(orderTimer);
    if (disconnectTimer) clearTimeout(disconnectTimer);
    emitDisconnected(reason);
    scheduleReconnects();
  };

  const scheduleReconnects = () => {
    const offlineUntil = Date.now() + rand(2_000, 6_000);
    let attempt = 1;
    let backoff = 400;

    const attemptReconnect = () => {
      emitReconnecting(attempt);
      if (Date.now() >= offlineUntil) {
        connected = true;
        emitReconnected();
        emitConnected();
        scheduleNextOrder();
        scheduleDisconnectCycle();
        return;
      }
      attempt += 1;
      backoff = Math.min(backoff * 2, 4_000);
      reconnectTimer = setTimeout(attemptReconnect, backoff);
    };

    reconnectTimer = setTimeout(attemptReconnect, backoff);
  };

  emitConnected();
  scheduleNextOrder();
  scheduleDisconnectCycle();

  const subscribe = (listener: Listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  const setChaosMode = (value: boolean) => {
    chaosMode = value;
  };

  const setEventRate = (value: EventRate) => {
    eventRate = value;
  };

  const simulateDisconnect = () => {
    triggerDisconnect("manual");
  };

  const shutdown = () => {
    connected = false;
    if (orderTimer) clearTimeout(orderTimer);
    if (disconnectTimer) clearTimeout(disconnectTimer);
    if (reconnectTimer) clearTimeout(reconnectTimer);
    listeners.clear();
  };

  return {
    subscribe,
    setChaosMode,
    setEventRate,
    simulateDisconnect,
    shutdown,
  };
}

import type {
  OrderCreatedEvent,
  OrderDeliveredEvent,
  OrderPickedEvent,
  OrderShippedEvent,
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
const PICK_DELAY_MS: [number, number] = [250, 900];
const SHIP_DELAY_MS: [number, number] = [600, 1800];
const DELIVER_DELAY_MS: [number, number] = [1000, 2600];
const CATEGORIES = [
  "Living room",
  "Kids",
  "Office",
  "Bedroom",
  "Kitchen",
  "Bathroom",
  "Dining room",
  "Decor",
  "Outdoor",
];
const COUNTRIES = [
  "United States",
  "Canada",
  "Germany",
  "France",
  "Spain",
  "Italy",
  "Poland",
  "Romania",
];
const CUSTOMERS = [
  "cus_acme",
  "cus_globex",
  "cus_umbrella",
  "cus_stark",
  "cus_wayne",
  "cus_vehement",
  "cus_initech",
  "cus_hooli",
];

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
  let seq = 0;

  const listeners = new Set<Listener>();

  const makeEnvelope = (ts = Date.now()) => {
    const eventId = createId();
    seq += 1;
    return {
      id: eventId,
      eventId,
      ts,
      seq,
    };
  };

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
    const now = Date.now();
    const event: StreamConnectedEvent = {
      ...makeEnvelope(now),
      type: "stream_connected",
      at: now,
    };
    emit(event);
  };

  const emitDisconnected = (reason: StreamDisconnectedEvent["reason"]) => {
    const now = Date.now();
    const event: StreamDisconnectedEvent = {
      ...makeEnvelope(now),
      type: "stream_disconnected",
      at: now,
      reason,
    };
    emit(event);
  };

  const emitReconnecting = (attempt: number) => {
    const now = Date.now();
    const event: StreamReconnectingEvent = {
      ...makeEnvelope(now),
      type: "stream_reconnecting",
      at: now,
      attempt,
    };
    emit(event);
  };

  const emitReconnected = () => {
    const now = Date.now();
    const event: StreamReconnectedEvent = {
      ...makeEnvelope(now),
      type: "stream_reconnected",
      at: now,
    };
    emit(event);
  };

  const scheduleNextOrder = () => {
    if (!connected) return;
    const [minMs, maxMs] = RATE_MS[eventRate];
    orderTimer = setTimeout(() => {
      if (!connected) return;
      const now = Date.now();
      const customerId = CUSTOMERS[rand(0, CUSTOMERS.length - 1)];
      const category = CATEGORIES[rand(0, CATEGORIES.length - 1)];
      const country = COUNTRIES[rand(0, COUNTRIES.length - 1)];
      const orderId = `ord_${customerId}_${now.toString(36)}_${rand(10, 99)}`;
      const created: OrderCreatedEvent = {
        ...makeEnvelope(now),
        type: "order_created",
        orderId,
        customerId,
        country,
        category,
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
          const authorizedAt = Date.now();
          const authorized: PaymentAuthorizedEvent = {
            ...makeEnvelope(authorizedAt),
            type: "payment_authorized",
            orderId,
            authorizedAt,
          };
          emit(authorized);

          const shouldShip = Math.random() < 0.8;
          if (shouldShip) {
            setTimeout(() => {
              if (!connected) return;
              const pickedAt = Date.now();
              const picked: OrderPickedEvent = {
                ...makeEnvelope(pickedAt),
                type: "order_picked",
                orderId,
                pickedAt,
              };
              emit(picked);
            }, rand(PICK_DELAY_MS[0], PICK_DELAY_MS[1]));

            setTimeout(() => {
              if (!connected) return;
              const shippedAt = Date.now();
              const shipped: OrderShippedEvent = {
                ...makeEnvelope(shippedAt),
                type: "order_shipped",
                orderId,
                shippedAt,
                carrier: ["ups", "fedex", "dhl"][rand(0, 2)] as OrderShippedEvent["carrier"],
              };
              emit(shipped);
            }, rand(SHIP_DELAY_MS[0], SHIP_DELAY_MS[1]));

            const shouldDeliver = Math.random() < 0.75;
            if (shouldDeliver) {
              setTimeout(() => {
                if (!connected) return;
                const deliveredAt = Date.now();
                const delivered: OrderDeliveredEvent = {
                  ...makeEnvelope(deliveredAt),
                  type: "order_delivered",
                  orderId,
                  deliveredAt,
                };
                emit(delivered);
              }, rand(DELIVER_DELAY_MS[0], DELIVER_DELAY_MS[1]));
            }
          }
        } else {
          const failedAt = Date.now();
          const failed: PaymentFailedEvent = {
            ...makeEnvelope(failedAt),
            type: "payment_failed",
            orderId,
            failedAt,
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
    return () => {
      listeners.delete(listener);
    };
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

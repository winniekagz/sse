export type OrderEventType =
  | "order_created"
  | "payment_authorized"
  | "payment_failed"
  | "order_picked"
  | "order_shipped"
  | "order_delivered"
  | "order_cancelled";

export type SystemEventType =
  | "stream_connected"
  | "stream_disconnected"
  | "stream_reconnecting"
  | "stream_reconnected";

export type StreamEventType = OrderEventType | SystemEventType;

export type EventEnvelope = {
  // Existing key retained for backward compatibility with current UI table row ids.
  id: string;
  // Canonical event identifier for dedupe/replay semantics.
  eventId: string;
  // Stream timestamp in epoch ms.
  ts: number;
  // Monotonic stream sequence.
  seq: number;
  type: StreamEventType;
};

export type OrderCreatedEvent = EventEnvelope & {
  type: "order_created";
  orderId: string;
  customerId: string;
  country: string;
  category: string;
  amount: number;
  currency: "USD";
  createdAt: number;
};

export type PaymentAuthorizedEvent = EventEnvelope & {
  type: "payment_authorized";
  orderId: string;
  authorizedAt: number;
};

export type PaymentFailedEvent = EventEnvelope & {
  type: "payment_failed";
  orderId: string;
  failedAt: number;
  reason: "insufficient_funds" | "card_expired" | "network_error";
};

export type OrderPickedEvent = EventEnvelope & {
  type: "order_picked";
  orderId: string;
  pickedAt: number;
};

export type OrderShippedEvent = EventEnvelope & {
  type: "order_shipped";
  orderId: string;
  shippedAt: number;
  carrier: "ups" | "fedex" | "dhl";
};

export type OrderDeliveredEvent = EventEnvelope & {
  type: "order_delivered";
  orderId: string;
  deliveredAt: number;
};

export type OrderCancelledEvent = EventEnvelope & {
  type: "order_cancelled";
  orderId: string;
  cancelledAt: number;
  reason: "customer_request" | "inventory" | "payment_timeout";
};

export type OrderEvent =
  | OrderCreatedEvent
  | PaymentAuthorizedEvent
  | PaymentFailedEvent
  | OrderPickedEvent
  | OrderShippedEvent
  | OrderDeliveredEvent
  | OrderCancelledEvent;

export type StreamConnectedEvent = EventEnvelope & {
  type: "stream_connected";
  at: number;
};

export type StreamDisconnectedEvent = EventEnvelope & {
  type: "stream_disconnected";
  at: number;
  reason: "network" | "server" | "manual";
};

export type StreamReconnectingEvent = EventEnvelope & {
  type: "stream_reconnecting";
  at: number;
  attempt: number;
};

export type StreamReconnectedEvent = EventEnvelope & {
  type: "stream_reconnected";
  at: number;
};

export type SystemEvent =
  | StreamConnectedEvent
  | StreamDisconnectedEvent
  | StreamReconnectingEvent
  | StreamReconnectedEvent;

export type StreamEvent = OrderEvent | SystemEvent;

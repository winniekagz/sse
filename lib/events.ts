export type OrderCreatedEvent = {
  id: string;
  type: "order_created";
  orderId: string;
  amount: number;
  currency: "USD";
  createdAt: number;
};

export type PaymentAuthorizedEvent = {
  id: string;
  type: "payment_authorized";
  orderId: string;
  authorizedAt: number;
};

export type PaymentFailedEvent = {
  id: string;
  type: "payment_failed";
  orderId: string;
  failedAt: number;
  reason: "insufficient_funds" | "card_expired" | "network_error";
};

export type OrderEvent =
  | OrderCreatedEvent
  | PaymentAuthorizedEvent
  | PaymentFailedEvent;

export type StreamConnectedEvent = {
  id: string;
  type: "stream_connected";
  at: number;
};

export type StreamDisconnectedEvent = {
  id: string;
  type: "stream_disconnected";
  at: number;
  reason: "network" | "server" | "manual";
};

export type StreamReconnectingEvent = {
  id: string;
  type: "stream_reconnecting";
  at: number;
  attempt: number;
};

export type StreamReconnectedEvent = {
  id: string;
  type: "stream_reconnected";
  at: number;
};

export type SystemEvent =
  | StreamConnectedEvent
  | StreamDisconnectedEvent
  | StreamReconnectingEvent
  | StreamReconnectedEvent;

export type StreamEvent = OrderEvent | SystemEvent;

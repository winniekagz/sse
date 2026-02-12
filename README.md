# SSE Orders Dashboard

Frontend-only realtime orders dashboard built with Next.js and a simulated SSE stream.

## What This App Is
- A live operations dashboard for order lifecycle monitoring.
- A demo of event-driven UI state derivation from streaming events.
- A portfolio project for SSE ingestion, timeline auditability, and drill-down UX.

Demo link: local by default at `http://localhost:3000`.

## Why SSE (vs Polling vs WebSockets)
- `SSE`: one-way server-to-client stream, simple retry semantics, lightweight for dashboards.
- `Polling`: easier infra but wasteful and laggy under frequent updates.
- `WebSockets`: full duplex and powerful, but more moving parts than needed for read-heavy dashboards.

This app uses SSE as the data plane and keeps command/control actions local/mock.

## Event Contract
Every event is wrapped in a contract with replay-safe fields:

- `eventId`: stable unique event key for dedupe.
- `ts`: stream timestamp (epoch ms).
- `seq`: monotonic stream sequence for ordering and replay cursors.
- `orderId`: present on order domain events.
- `type`: event type (`order_created`, `payment_failed`, `order_shipped`, etc).

Backward compatibility:
- Legacy `id` is still present and mirrors `eventId`.
- Client ingest normalizes missing `eventId/ts/seq`.

## Event-Driven UI Approach
1. Stream emits events (`lib/stream/fakeSse.ts`).
2. Buffer batches events (`lib/stream/buffer.ts`).
3. Store ingests batch and normalizes envelope (`lib/state/normalizeEvent.ts`).
4. Pure reducers derive order state and per-order timelines (`lib/domain/orders/reducer.ts`).
5. Selectors derive UI slices and KPI counts (`lib/domain/orders/selectors.ts`).

Key principles:
- Reducers are pure and deterministic.
- UI components stay mostly presentational.
- Timelines form a lightweight audit log for each order.
- Regressions are ignored by default (except explicit allowed transitions).

## Reconnect + Replay Plan
Current:
- Connection transitions are streamed (`connected`, `reconnecting`, `reconnected`, `disconnected`).
- Client tracks `lastSeq`.

Next:
- Add server support for `?since=seq`.
- On reconnect, request missed events using `lastSeq`.
- Show a small "Catching up..." UI chip while replaying.

## Dashboard vs Search Logic
- Dashboard: continuous event stream -> reduced aggregates, KPIs, exceptions, timelines.
- Search: query-driven indexing over current client state -> focused cross-domain hits.

## Features
- Live orders, customers, and activity tables.
- Order drawer with status, stepper, issue callout, and timeline.
- KPI strip with clickable state filters (Total, Failed, Pending, Shipped, Delivered).
- Chaos mode for duplicate/out-of-order stream simulation.

## Tech Stack
- Next.js (App Router)
- React + TypeScript
- Zustand
- Tailwind CSS
- TanStack Table
- Recharts

## Local Development
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
npm run start
```

## Repository Layout
- `app/` routes and page composition
- `components/` UI primitives and dashboard views
- `lib/` stream simulation, state management, reducers, selectors, metrics, search
- `docs/` implementation notes and writing outline


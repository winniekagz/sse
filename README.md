# SSE Orders Dashboard

Business-ready, frontend-only realtime dashboard powered by a simulated SSE stream. It showcases order flows, customer rollups, activity logs, and global search with an emphasis on operational visibility.

## Highlights
- Realtime SSE simulation with buffering and reconnect UX.
- Business KPI strip and exceptions panel.
- Orders, customers, and activity tables built on TanStack Table.
- Global search across orders, activity, and customers.
- Order drill-down drawer with event timeline.
- Ops controls with Business and Developer modes.

## Tech Stack
- Next.js (App Router)
- React
- Tailwind CSS
- Zustand (state)
- TanStack Table (tables)
- Recharts (charts)
- Framer Motion (table row animation)

## Local Development
```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Build
```bash
npm run build
npm run start
```

## Repository Layout
- `app/` — Next.js routes and page layout.
- `components/` — UI primitives and dashboard components.
- `lib/` — stream simulation, state store, metrics, and search.
- `public/` — static assets.

## Key Data Flow
1. `createFakeSse` emits simulated SSE events.
2. `createEventBuffer` batches events.
3. `dashboardStore.ingestBatch` updates orders, metrics, and event log.
4. UI renders KPIs, exceptions, tables, and charts from derived state.

## Notes
- Stream behavior, event contracts, and routes are frontend-only and intentionally stable for demos.
- KPI and exception thresholds are configurable in `lib/metrics/thresholds.ts`.

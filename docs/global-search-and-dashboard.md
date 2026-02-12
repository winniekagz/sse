# Global Search and Dashboard

This document describes how the global search and realtime dashboard work, how data is ingested, and where to extend behavior.

## Overview
The dashboard is a frontend-only SSE simulation. Data is streamed into a buffered store and then derived into business-facing metrics, exceptions, and table rows. Global search indexes the same client state and allows cross-domain results.

## Data Flow
1. `createFakeSse` emits simulated `StreamEvent` objects.
2. `createEventBuffer` batches events at a fixed interval.
3. `useDashboardStore.ingestBatch`:
   - Updates `orders` and `eventLog`
   - Rebuilds customer and sales rollups
   - Computes rolling-window stats (orders/min, success rate, average order value)
4. UI components read the store and render the dashboard.

## Global Search
Global search is composed of three domain providers.

### Providers
- Orders provider: `createOrderSearchProvider(orders)`
- Activity provider: `createActivitySearchProvider(eventLog)`
- Customers provider: `createCustomerSearchProvider(orders)`

Each provider returns `SearchHit` items with:
- `domain` (`orders`, `activity`, or `customers`)
- `title` (primary label)
- `subtitle` (secondary info)
- `id` (stable identifier)

### Search Flow
1. The input in `DashboardTopNav` updates `globalQuery`.
2. `createGlobalSearchService` parses the query and searches all providers.
3. Results are rendered in the search panel with domain tags.
4. Clicking a hit scrolls to the relevant table section.

### Extending Search
To add a domain:
1. Extend `lib/search/types.ts` with a new domain.
2. Create a provider in `lib/search/providers.ts`.
3. Register it in `app/page.tsx` within `createGlobalSearchService`.

## Dashboard KPI Strip
KPIs are derived from existing in-memory state (no backend).

Computed in `lib/metrics/computeKpis.ts`:
- Orders today (local time, `createdAt >= startOfToday`)
- Revenue today (sum of today’s orders)
- Failed payments (from events)
- At-risk shipments (authorized but stale)
- Avg time in state (created -> updated)

Thresholds are defined in `lib/metrics/thresholds.ts`.

## Exceptions Panel
Exceptions are actionable summaries computed from orders + recent events.

Computed in `lib/metrics/computeExceptions.ts`:
- Payment pending over threshold
- Shipments delayed over threshold
- Failure spikes within a rolling window

Each exception row is clickable and applies an orders filter.

## Orders Table and Filters
Filters are pure functions in `lib/filters/ordersFilter.ts`.  
The Orders table receives the filtered list and shows a “Clear” chip when active.

## Order Drawer
Clicking an order opens a side drawer with:
- Status and last updated time
- Event timeline (newest first)
- Customer, Payment, and Shipping sections
- Next action buttons (mocked handlers)

Order event history is captured in the store under `orderEventsById`.

## Ops Controls Modes
Sidebar controls provide two modes:
- Business View: minimal, renamed controls
- Developer Demo: full original controls

Behavior and handlers remain unchanged; only presentation varies.

## Files to Know
- `app/page.tsx` — main dashboard composition
- `lib/state/dashboardStore.ts` — realtime state and derivations
- `lib/metrics/*` — KPI + exceptions
- `lib/search/*` — search providers and parsing
- `components/organisms/*` — KPI strip, exceptions, tables, drawer

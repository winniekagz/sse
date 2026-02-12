# Blog Outline: Building an Event-Driven SSE Orders Dashboard

## 1. Problem Framing
- Why operational dashboards need streaming updates
- Constraints: low-latency read model, auditability, minimal infra

## 2. Choosing SSE for the Data Plane
- SSE vs polling vs WebSockets tradeoffs
- Why one-way streaming matched this project

## 3. Designing the Event Contract
- `eventId`, `ts`, `seq`, `orderId`, `type`
- Backward compatibility and ingest normalization
- Why monotonic `seq` unlocks replay

## 4. Reducers as the Source of Truth
- `reduceOrder(prev, event) -> next`
- `applyEventToStore(store, event) -> nextStore`
- Dedupe, ordering, and regression handling

## 5. Derived State and Selectors
- KPI derivation from `ordersById`
- `currentIssue` derivation and exception logic
- Performance: memoization and stable selectors

## 6. Building the Order Drill-Down Drawer
- Row click wiring with minimal coupling
- Stepper, timeline, issue callout, and next actions
- Accessibility (ESC + focus management)

## 7. Shipping Incrementally Without Breaking UI
- Additive changes over rewrites
- Keeping existing stream behavior intact
- Small, PR-sized commits and validation checklist

## 8. Reconnect and Replay Roadmap
- Tracking `lastSeq`
- `?since=seq` catch-up flow
- UX for catch-up progress

## 9. Search vs Dashboard Mental Model
- Dashboard as continuous aggregate projection
- Search as query-driven access to current projection

## 10. Lessons Learned
- Event contracts age better than ad hoc payloads
- Reducer-first design simplifies UI complexity
- Timeline/audit features emerge naturally from stream storage


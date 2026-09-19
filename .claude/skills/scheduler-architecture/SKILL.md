---
name: scheduler-architecture
description: Engineering rules specific to this scheduler: what is public vs internal, the time model, the event store contract, the four extension points, the dependency policy and the mandatory build order. Use before adding any export, touching core/, or starting a view.
user-invocable: true
---

# Scheduler Architecture

Design notes and the reasoning behind these rules live in `docs/`, which is local-only and gitignored. Nothing tracked in the repository may depend on a file there. Keep it current anyway. It is where the _why_ lives.

## Build order, do not reorder

1. `scheduler.types.ts` in full
2. `EventStore` and the mutation pipeline
3. The DST golden table (tests)
4. The first view

Types and the store shape everything after them. The DST table written first means the week view is correct the first time instead of after a bug report.

## Time

- Internal time is always `ZonedDateTime` from `@internationalized/date`. Never a bare `Date`, never manual offset arithmetic.
- Public API accepts ISO strings and `ZonedDateTime`; normalise to `ZonedDateTime` at the boundary, once.
- Every date-arithmetic helper has a row in the DST golden table: `America/New_York` (March and November), `Europe/London`, `Australia/Sydney` (southern hemisphere, reversed direction). Cover both the skipped hour and the repeated hour.

## Public vs internal

| Public (in `src/lib/index.ts`)           | Internal (never exported)                                  |
| ---------------------------------------- | ---------------------------------------------------------- |
| `Scheduler` component and the four views | `core/layout/*`: overlap solver, lane packing, grid layout |
| All types in `scheduler.types.ts`        | Any concrete `LayoutStrategy` implementation               |
| `TimeScale` (`core/time/scale.ts`)       | Store internals beyond the class surface                   |
| `LayoutStrategy` **interface**           |                                                            |
| The four registration functions          |                                                            |

The layout engine is deliberately internal. Do not export it, do not re-export it "for testing", do not widen an area barrel without a reason written in the PR. The root `src/lib/index.ts` only joins the area barrels with `export *`; each area barrel names its exports explicitly. Adding an export later is free; removing one is a breaking change.

## Layout engine is pure

Everything in `core/layout/` takes data and returns coordinates. No DOM, no `window`, no measurement. It is tested in the `node` Vitest project by comparing returned positions, and it runs under SSR because nothing in it touches the browser.

## Event store

```ts
class EventStore {
    #events = $state.raw<ReadonlyMap<string, SchedulerEvent>>(new Map())
    #version = $state(0)
    get version(): number
    query(range: DateRange): SchedulerEvent[]
    apply(patch: EventPatch): void
    snapshot(): StoreSnapshot
    restore(snapshot: StoreSnapshot): void
}
```

- Copy-on-write: every mutation produces a new map; a snapshot is a reference to the old one.
- `$state.raw`, not `$state`: the map is replaced wholesale, so deep proxying is pure overhead.
- It is a class so the storage can later move to a structurally-shared structure without changing the interface.

## Mutation pipeline

1. Apply optimistically; the UI updates immediately
2. Enqueue **per `eventId`**, separate queues, so dragging two different events never blocks
3. `await onMutate(mutation)`
4. Success -> commit. Failure -> `restore(snapshot)` with an animation returning the event to its previous place
5. Server returned something other than `after` -> `onConflict(mutation, server)` decides `'keep-server' | 'keep-local'`

## Four extension points

`registerView`, `registerLayout`, `useMiddleware`, `registerInteraction`. Anything that extends the scheduler goes through these and nothing else. If something cannot be built through them, the extension point is widened here first, never worked around by reaching into internals. Design them before the first view exists.

## `RecurrenceRule` fields the engine does not support

The type describes full RFC 5545. When the engine meets a field it does not implement, it warns in dev (`import.meta.env.DEV`) and ignores the field. It never throws: user data must not have to change shape when the engine grows.

## Dependency policy

- `sv5ui` is a **peer dependency**. Every UI element and every hook that sv5ui provides is imported from it, never rebuilt (see `sv5ui-conventions`). It also brings `@internationalized/date`, `tailwind-merge` and `tailwind-variants`, which this package lists as peers with the same ranges so an app never ends up with two copies.
- No other runtime dependency. A new one needs a reason in the PR and an entry in `docs/`.
- No dependency may pull in a second copy of `svelte`. When linking a sibling repo locally, pack it into a tarball rather than symlinking.

## SSR

Every component renders on the server without touching `window`, `document` or `navigator`. Browser-only work goes in `$effect` or in an interaction module that is only invoked from a pointer or keyboard event.

## Accessibility is not optional

Keyboard navigation and ARIA are designed into every view from the first commit: Tab into the grid, arrows between cells, Enter to create, Escape to cancel a drag. Tests for these live in the chromium project and are part of the definition of done for any view.

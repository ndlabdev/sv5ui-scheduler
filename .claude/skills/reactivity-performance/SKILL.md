---
name: reactivity-performance
description: How to keep the scheduler fast under Svelte 5 fine-grained reactivity. Derived granularity, keyed lists, raw state for collections, drag without store churn, layout memoisation, DOM budget, and how to measure. Use before writing any view, store or interaction code, and when something feels slow.
user-invocable: true
---

# Reactivity and Performance

Svelte 5 re-runs only the `$derived` and template expressions that read a changed signal. Slowness therefore comes from three places: a derived that reads too much, a collection that is deeply proxied, or work done per pointer event. Every rule below removes one of those.

## Derived granularity

- One `$derived` per question, not one giant `$derived` that rebuilds the whole view model. A change to a single event must not recompute the month grid, the week grid and the agenda list at once.
- Derive the visible slice first, then derive layout from the slice:

```ts
const visibleEvents = $derived(store.query(range))
const dayColumns = $derived(splitByDay(visibleEvents, range, timeZone))
const positioned = $derived.by(() => dayColumns.map((day) => layoutDay(day, scale)))
```

`positioned` reruns when `dayColumns` changes, and `dayColumns` reruns only when `visibleEvents` or `range` changes. Do not collapse these into one block.

- Read `store.version` only where a full recompute is intended. Reading it in a per-cell derived turns every mutation into a full re-render.
- Precompute per-cell view models in a derived array. The template reads fields; it never calls `toZoned`, `compare`, or formatting functions per cell.
- `untrack()` when reading a signal whose changes must not rerun the derived, such as `now` inside a layout that should only move on the minute tick.

## Collections

- `$state.raw` for the event map, positioned arrays, and any list over a few dozen items. Replace wholesale; never mutate in place.
- Selection, hover and drag state are separate small signals, never fields written into the event objects. Writing `event.isSelected = true` would re-render every reader of that event.
- Keyed `{#each positioned as item (item.event.id)}` everywhere. An unkeyed list re-creates every DOM node when one event moves.

## Effects

- `$effect` only for DOM measurement, observers, timers and subscriptions. If it assigns a value that a derived could compute, it is a derived.
- Never write reactive state inside a derived or a pure transform. If a computation needs to seed state, collect and apply in `queueMicrotask` with a memo so it converges.
- Guard `$effect` bodies against a null `ref` on first run.

## Drag, resize and pointer work

- During a gesture, the store is untouched. Only a small `$state` holds `{ pointer, offset, snappedStart, snappedEnd }`. The ghost is positioned with `transform: translate()` computed from that state. The store receives one `apply()` on drop.
- Pointer moves are coalesced to one per animation frame. Use `usePointerDrag` from sv5ui, which already throttles and handles capture, axis lock and cleanup.
- Snapping is integer arithmetic on minutes since day start, done once per frame, not per rendered event.
- Read layout (`getBoundingClientRect`) at gesture start and cache it. Reading it per move interleaved with style writes causes layout thrash.
- `will-change: transform` on the ghost only while dragging; remove it on drop.

## Layout memoisation

- Layout functions are pure, so they can be memoised on their inputs. Key per day column on `(dayKey, eventsInDay, scale)`; a mutation in Tuesday must not relayout Friday.
- Overlap clustering is O(n log n) per column (see the `algorithms` skill). Never O(n^2) pairwise checks.
- `TimeScale` is built once per range change, not per event.

## DOM budget

- The DOM holds only what the visible range shows. A month view renders its 5 or 6 weeks; it does not pre-render adjacent months.
- Cap rendered events per cell in month view with a "+N more" affordance instead of stacking dozens of chips.
- Slot grid lines are CSS backgrounds (`repeating-linear-gradient`) or a small number of elements, not one element per 15-minute slot.
- `contain: layout paint` on each day column so a change inside one column does not invalidate siblings.

## Props and snippets

- Pass primitives and stable object references, not fresh object literals built in the template.
- Snippet parameters are objects built in a derived once per item, not inline in `{@render}`.
- Avoid `bind:` on hot paths; pass a callback prop.

## Attachments: three rules learned the hard way

All three cost real time on 2026-09-12 while wiring the first view. Each produced an `effect_update_depth_exceeded` loop.

1. **Attachment bodies run inside a tracking effect.** `{@attach fn}` re-creates only when `fn`'s identity changes, but the inner effect that calls `fn(node)` tracks every signal read during the call. A plugin that reads or writes state in its attach body (for example calling `commit`, which touches the pending set) re-attaches on every change of that state. Plugin attachments must run under `untrack`; `composeAttachments` in `interactions/attachments.ts` does this, so route every plugin through it.
2. **A spread destroys prop stability.** With `<View {...props} interactions={x} />` Svelte folds every prop into one derived, so a change to any spread member invalidates the `interactions` getter too, and the attachment effect re-runs. Pass props that carry attachments or other identity-sensitive values as explicit props on a component with no spread, or accept that they re-run.
3. **An object handed to attachments must be stable; make its reactive fields getters.** `interactionContext` was a `$derived` object literal, so every focus change produced a new object, every plugin re-attached and a drag in progress was torn down by its own focus update. It is now one object created once, with `get focus() { return focus }` style getters for the reactive parts. `src/tests/interactions.svelte.spec.ts` drives real gestures and would loop or drop the gesture if this regressed.
4. **sv5ui hooks do run inside an attachment.** `usePointerDrag` uses `$effect`, and an attachment body is an effect context, so calling it there is legal; its effects are children of the attachment and are cleaned up with it. `src/tests/hook-in-attachment.svelte.spec.ts` proves it. Keep the body under `untrack` all the same.
5. **Browser tests need the theme loaded.** Without `src/tests/setup.browser.ts` importing the stylesheet, Tailwind classes do nothing, grids collapse to zero height and every geometry-dependent assertion fails for a reason that looks like a logic bug.
6. **Sync effects compare against what you last synced, not against the target.** The array-to-store effect first runs after mount; anything that touched the store between init and that first run (a plugin committing on attach) looked like a divergence and got reset away. Keep the last mirrored snapshot and compare the input to that. `Scheduler.svelte` keeps `mirrored` for exactly this.

## Measure before optimising

- A browser spec that mounts a week with 500 events and asserts render time under a budget is the regression guard for every rule above. Keep it green.
- When something feels slow, profile first: Performance tab, look for long `$derived` bodies and forced reflows, then apply the matching rule. Do not guess.

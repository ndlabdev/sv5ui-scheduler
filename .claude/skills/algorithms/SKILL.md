---
name: algorithms
description: The algorithms and data structures this scheduler uses and why. Overlap solving by sweep line, multi-day lanes in the month grid, range queries on sorted events, time to pixel mapping, DST-safe date arithmetic, per-event mutation queues and ISO week numbers. Use before implementing or changing anything in core/.
user-invocable: true
---

# Algorithms

Every rule here has the same shape: name the problem, pick the structure that fits, state the complexity, and prove it with a node spec that compares returned values. If a choice is not on this page, write the reasoning in the PR and add it here.

## Overlap solver (time grid)

Problem: events in one day column that share time must not draw on top of each other.

Approach: sweep line over an interval graph.

1. Sort by start ascending, then by duration descending, so long events take the left column.
2. Walk once. Maintain the current cluster (connected component): an event joins the cluster if its start is before the cluster's running max end; otherwise close the cluster and start a new one.
3. Inside a cluster, assign each event the lowest column whose last end is at or before the event's start (first fit). Track `lastEnd` per column.
4. Width of every event in the cluster is `1 / columnCount`; left is `column / columnCount`. Optional: let an event expand right into empty columns until the next occupied one.

Complexity: O(n log n) for the sort, O(n * c) for placement where c is the cluster's column count. Never compare every pair.

Spec cases: two identical events, three partially overlapping, one long event spanning many short ones, an event ending exactly when the next starts (end-exclusive, so they do not overlap), an event crossing midnight (split into two segments before layout).

## Multi-day and all-day lanes (month grid and all-day row)

Problem: events spanning several days must render as one bar per week row, and bars must not collide.

1. Clip each event to each week row it touches, producing segments `{ eventId, rowIndex, startCol, endCol }`.
2. Per row, sort segments by `startCol`, then by span descending.
3. Assign lanes with first fit: lane `k` is free if its last `endCol` is before the segment's `startCol`.
4. Lanes beyond the cell's visible cap collapse into a "+N more" count per cell.

Complexity: O(s log s) per row where s is segments in that row.

## Range queries on the store

Problem: `query(range)` must be cheap because every view derives from it.

Keep a sorted array of events by start, rebuilt on mutation (O(n log n), acceptable at core scale). Query:

1. Binary search the first event whose `end > range.start`. Because durations vary, search on `start >= range.start - maxDuration` where `maxDuration` is tracked on insert, then filter the small prefix.
2. Walk forward while `start < range.end`.

Complexity: O(log n + k) where k is results plus the maxDuration slack. If `maxDuration` becomes large (a year-long event), fall back to a linear scan for that store; measure before adding an interval tree.

## Time to pixel

`TimeScale` is a linear map from minutes since the column's start to pixels:

```
px = (minutesFromStart / minutesPerSlot) * slotHeight
```

- Compute `minutesFromStart` from real `ZonedDateTime` differences, so a 23-hour or 25-hour DST day scales correctly.
- Snap by rounding minutes to the slot size, then map. Never snap in pixel space.
- Keep the inverse (`pixelToTime`) in the same module and test that they round-trip.

## Date arithmetic under DST

- Add days with `date.add({ days: 1 })`, never `add({ hours: 24 })`. The first crosses DST correctly; the second lands an hour off.
- Start of day is `startOfDay(date)` from the zoned value; day length is `end - start` in minutes, which is 1380, 1440 or 1500.
- Compare with `compare()` from `@internationalized/date`, never by converting to epoch and subtracting offsets by hand.
- Ranges are end-exclusive: `[start, end)`. An event ending at `range.start` is outside the range.
- Every helper here has a row in the DST golden table: New York March and November, London, Sydney.

## Week numbers (ISO 8601)

Week 1 is the week containing the year's first Thursday. Compute: shift the date to its Thursday (`date + (4 - isoWeekday)`), take that year, week = `floor((dayOfYear(thursday) - 1) / 7) + 1`. Test the boundaries: 2021-01-01 is week 53 of 2020; 2024-12-30 is week 1 of 2025.

## Mutation queue

Problem: consecutive mutations on one event must run in order; mutations on different events must not wait for each other.

```
queues: Map<eventId, Promise<void>>
enqueue(eventId, task):
    const tail = queues.get(eventId) ?? Promise.resolve()
    const next = tail.then(task, task)
    queues.set(eventId, next.finally(() => { if (queues.get(eventId) === next) queues.delete(eventId) }))
```

The identity check in `finally` keeps a newer chain from being deleted by an older one settling late.

## Immutable store copies

Copying a `Map` per mutation is O(n). At core scale (thousands of events) this is well under a frame. The class boundary exists so the storage can move to a structurally shared map later without changing callers. Do not optimise this before a benchmark shows it matters.

## Recurrence expansion (when it lands)

Expand lazily and bounded: iterate occurrences from the rule's start, skip until `range.start`, stop at `range.end`, `count` or `until`, whichever comes first. Never materialise an unbounded rule. Apply `exDates` after generation by comparing zoned instants.

## Choosing and proving

- Prefer sorted arrays and binary search over trees until a measurement says otherwise. Fewer allocations, simpler tests.
- `Map` keyed by id for lookups, `Set` for selection membership, arrays for ordered output.
- State the complexity in the PR description for any new algorithm.
- Every algorithm ships with a node spec that asserts coordinates or ids, and a benchmark spec when it sits on a hot path.

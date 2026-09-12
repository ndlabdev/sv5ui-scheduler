import type { SchedulerEvent } from '../../types/event.types.js'
import type { LayoutContext, TimePosition } from '../../types/extension.types.js'
import type { DateRange } from '../../types/range.types.js'
import { assignColumns, type ColumnPlacement } from './overlap.js'
import { isWholeDay, segmentsInRange, type EventSegment } from './segments.js'

const FULL_WIDTH: ColumnPlacement = { column: 0, columns: 1 }

export function layoutTimeGrid<T>(
    events: readonly SchedulerEvent<T>[],
    range: DateRange,
    context: LayoutContext
): TimePosition<T>[] {
    const timed = events.filter((event) => !isWholeDay(event))
    const segments = segmentsInRange(timed, range, context.days)
    const positions: TimePosition<T>[] = []

    for (const daySegments of groupByDay(segments, context.days.length)) {
        const foreground = daySegments.filter((segment) => !segment.event.background)
        const placements = assignColumns(
            foreground.map((segment) => ({
                startMs: segment.start.toDate().getTime(),
                endMs: segment.end.toDate().getTime()
            }))
        )
        const placementOf = new Map(foreground.map((segment, i) => [segment, placements[i]]))
        for (const segment of daySegments) {
            positions.push(toPosition(segment, placementOf.get(segment) ?? FULL_WIDTH, context))
        }
    }
    return positions
}

function groupByDay<T>(segments: EventSegment<T>[], dayCount: number): EventSegment<T>[][] {
    const groups: EventSegment<T>[][] = Array.from({ length: dayCount }, () => [])
    for (const segment of segments) groups[segment.dayIndex].push(segment)
    return groups
}

function toPosition<T>(
    segment: EventSegment<T>,
    placement: ColumnPlacement,
    context: LayoutContext
): TimePosition<T> {
    const top = context.scale.toPixel(segment.start)
    const bottom = segment.continuesAfter
        ? context.scale.dayHeight
        : context.scale.toPixel(segment.end)
    return {
        kind: 'time',
        event: segment.event,
        dayIndex: segment.dayIndex,
        segmentStart: segment.start,
        segmentEnd: segment.end,
        top,
        height: bottom - top,
        left: placement.column / placement.columns,
        width: 1 / placement.columns,
        column: placement.column,
        columns: placement.columns
    }
}

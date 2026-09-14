import type { SchedulerEvent } from '../../types/event.types.js'
import type { LayoutContext, TimePosition, TimeScale } from '../../types/layout.types.js'
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
        const visible = daySegments.filter((segment) => isVisible(segment, context.scale))
        const foreground = visible.filter((segment) => !segment.event.background)
        const placements = assignColumns(
            foreground.map((segment) => ({
                startMs: segment.start.toDate().getTime(),
                endMs: segment.end.toDate().getTime()
            }))
        )
        const placementOf = new Map(foreground.map((segment, i) => [segment, placements[i]]))
        for (const segment of visible) {
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

function verticalSpan<T>(segment: EventSegment<T>, scale: TimeScale) {
    return {
        top: scale.toPixel(segment.start),
        bottom: segment.continuesAfter ? scale.dayHeight : scale.toPixel(segment.end)
    }
}

function isVisible<T>(segment: EventSegment<T>, scale: TimeScale): boolean {
    const span = verticalSpan(segment, scale)
    return span.top < scale.dayHeight && span.bottom > 0
}

function clampPixel(pixel: number, scale: TimeScale): number {
    return Math.min(Math.max(pixel, 0), scale.dayHeight)
}

function toPosition<T>(
    segment: EventSegment<T>,
    placement: ColumnPlacement,
    context: LayoutContext
): TimePosition<T> {
    const span = verticalSpan(segment, context.scale)
    const top = clampPixel(span.top, context.scale)
    const bottom = clampPixel(span.bottom, context.scale)
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

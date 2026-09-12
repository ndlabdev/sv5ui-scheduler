import type { SchedulerEvent } from '../../types/event.types.js'
import type { LayoutContext, SpanPosition } from '../../types/extension.types.js'
import type { DateRange } from '../../types/range.types.js'
import { assignLanes } from './lanes.js'
import { segmentsInRange, type EventSegment } from './segments.js'

interface RowSpan<T> {
    readonly event: SchedulerEvent<T>
    readonly row: number
    readonly startColumn: number
    readonly endColumn: number
    readonly continuesBefore: boolean
    readonly continuesAfter: boolean
}

export function layoutSpans<T>(
    events: readonly SchedulerEvent<T>[],
    range: DateRange,
    context: LayoutContext
): SpanPosition<T>[] {
    const segments = segmentsInRange(events, range, context.days)
    const rows = mergeIntoRows(segments, context.columnsPerRow)
    const positions: SpanPosition<T>[] = []

    for (const rowSpans of groupByRow(rows)) {
        const lanes = assignLanes(rowSpans)
        rowSpans.forEach((span, i) => {
            positions.push({ kind: 'span', ...span, lane: lanes[i] })
        })
    }
    return positions
}

export function overflowByCell(
    positions: readonly SpanPosition[],
    maxLanes: number,
    columnsPerRow: number
): Map<number, number> {
    const counts = new Map<number, number>()
    for (const position of positions) {
        if (position.lane < maxLanes) continue
        for (let column = position.startColumn; column < position.endColumn; column++) {
            const cell = position.row * columnsPerRow + column
            counts.set(cell, (counts.get(cell) ?? 0) + 1)
        }
    }
    return counts
}

function mergeIntoRows<T>(segments: EventSegment<T>[], columnsPerRow: number): RowSpan<T>[] {
    const spans = new Map<string, RowSpan<T>>()
    for (const segment of segments) {
        const row = Math.floor(segment.dayIndex / columnsPerRow)
        const column = segment.dayIndex % columnsPerRow
        const key = `${segment.event.id}:${row}`
        const existing = spans.get(key)
        spans.set(
            key,
            existing ? extendSpan(existing, column, segment) : startSpan(segment, row, column)
        )
    }
    return [...spans.values()]
}

function startSpan<T>(segment: EventSegment<T>, row: number, column: number): RowSpan<T> {
    return {
        event: segment.event,
        row,
        startColumn: column,
        endColumn: column + 1,
        continuesBefore: segment.continuesBefore,
        continuesAfter: segment.continuesAfter
    }
}

function extendSpan<T>(span: RowSpan<T>, column: number, segment: EventSegment<T>): RowSpan<T> {
    const leads = column < span.startColumn
    const trails = column + 1 > span.endColumn
    return {
        ...span,
        startColumn: leads ? column : span.startColumn,
        endColumn: trails ? column + 1 : span.endColumn,
        continuesBefore: leads ? segment.continuesBefore : span.continuesBefore,
        continuesAfter: trails ? segment.continuesAfter : span.continuesAfter
    }
}

function groupByRow<T>(spans: RowSpan<T>[]): RowSpan<T>[][] {
    const rows = new Map<number, RowSpan<T>[]>()
    for (const span of spans) {
        const row = rows.get(span.row) ?? []
        row.push(span)
        rows.set(span.row, row)
    }
    return [...rows.entries()].sort(([a], [b]) => a - b).map(([, row]) => row)
}

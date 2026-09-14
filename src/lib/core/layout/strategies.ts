import type { SchedulerEvent } from '../../types/event.types.js'
import type { LayoutContext, LayoutStrategy, PositionedEvent } from '../../types/layout.types.js'
import type { DateRange } from '../../types/range.types.js'
import { isWholeDay } from './segments.js'
import { layoutSpans } from './spans.js'
import { layoutTimeGrid } from './timegrid.js'

function layoutTimeGridView<T>(
    events: SchedulerEvent<T>[],
    range: DateRange,
    context: LayoutContext
): PositionedEvent<T>[] {
    const wholeDay = events.filter(isWholeDay)
    const allDayRow = { ...context, columnsPerRow: context.days.length }
    return [...layoutSpans(wholeDay, range, allDayRow), ...layoutTimeGrid(events, range, context)]
}

export const timeGridLayout: LayoutStrategy = {
    name: 'time-grid',
    layout: layoutTimeGridView
}

export const monthGridLayout: LayoutStrategy = {
    name: 'month-grid',
    layout: layoutSpans
}

export const listLayout: LayoutStrategy = {
    name: 'list',
    layout() {
        return []
    }
}

export const builtinLayouts: readonly LayoutStrategy[] = [
    timeGridLayout,
    monthGridLayout,
    listLayout
]

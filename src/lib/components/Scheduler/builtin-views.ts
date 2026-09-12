import type { ViewDefinition } from '../../types/extension.types.js'
import { formatDayRange, formatLongDate } from '../../core/time/format.js'
import { dayRange, stepDays, weekRange } from '../../core/time/view-ranges.js'
import DayView from '../DayView/DayView.svelte'
import WeekView from '../WeekView/WeekView.svelte'

export function createBuiltinViews<T>(): ViewDefinition<T>[] {
    return [
        {
            name: 'day',
            layout: 'time-grid',
            range: (anchor) => dayRange(anchor),
            step: (anchor, direction) => stepDays(anchor, direction),
            title: (anchor, _range, context) => formatLongDate(anchor, context.locale),
            component: DayView
        },
        {
            name: 'week',
            layout: 'time-grid',
            range: (anchor, context) => weekRange(anchor, context.weekStartsOn),
            step: (anchor, direction) => stepDays(anchor, 7 * direction),
            title: (_anchor, range, context) => formatDayRange(range, context.locale),
            component: WeekView
        }
    ]
}

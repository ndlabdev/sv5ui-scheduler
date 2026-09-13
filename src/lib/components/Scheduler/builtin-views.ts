import type { ViewDefinition } from '../../types/extension.types.js'
import { formatDate, formatDayRange, formatMonthYear, formatYear } from '../../core/time/format.js'
import {
    calendarMonthRange,
    dayRange,
    daysRange,
    monthRange,
    stepDays,
    stepMonths,
    stepYears,
    weekRange,
    yearRange
} from '../../core/time/view-ranges.js'
import AgendaView from '../AgendaView/AgendaView.svelte'
import DayView from '../DayView/DayView.svelte'
import MonthView from '../MonthView/MonthView.svelte'
import WeekView from '../WeekView/WeekView.svelte'
import YearView from '../YearView/YearView.svelte'

const DAYS_PER_WEEK = 7

export function createBuiltinViews<T>(): ViewDefinition<T>[] {
    return [
        {
            name: 'day',
            layout: 'time-grid',
            range: (anchor) => dayRange(anchor),
            step: (anchor, direction) => stepDays(anchor, direction),
            title: (anchor, _range, context) => formatDate(anchor, context.locale),
            component: DayView
        },
        {
            name: 'week',
            layout: 'time-grid',
            range: (anchor, context) =>
                context.dayCount
                    ? daysRange(anchor, context.dayCount)
                    : weekRange(anchor, context.weekStartsOn),
            step: (anchor, direction, context) =>
                stepDays(anchor, (context.dayCount ?? DAYS_PER_WEEK) * direction),
            title: (_anchor, range, context) => formatDayRange(range, context.locale),
            component: WeekView
        },
        {
            name: 'month',
            layout: 'month-grid',
            columnsPerRow: 7,
            range: (anchor, context) => monthRange(anchor, context.weekStartsOn),
            step: (anchor, direction) => stepMonths(anchor, direction),
            title: (anchor, _range, context) => formatMonthYear(anchor, context.locale),
            component: MonthView
        },
        {
            name: 'year',
            layout: 'list',
            range: (anchor) => yearRange(anchor),
            step: (anchor, direction) => stepYears(anchor, direction),
            title: (anchor, _range, context) => formatYear(anchor, context.locale),
            component: YearView
        },
        {
            name: 'agenda',
            layout: 'list',
            range: (anchor) => calendarMonthRange(anchor),
            step: (anchor, direction) => stepMonths(anchor, direction),
            title: (anchor, _range, context) => formatMonthYear(anchor, context.locale),
            component: AgendaView
        }
    ]
}

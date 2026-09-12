import { parseZonedDateTime, type ZonedDateTime } from '@internationalized/date'
import type { SchedulerEvent } from '../../types/event.types.js'
import type { LayoutContext, SchedulerContext } from '../../types/extension.types.js'
import type { DateRange } from '../../types/range.types.js'
import { eachDay } from '../time/range.js'
import { createTimeScale } from '../time/scale.js'

export const ZONE = 'America/New_York'

export function at(iso: string): ZonedDateTime {
    return parseZonedDateTime(`${iso}[${ZONE}]`)
}

export function event(
    id: string,
    start: string,
    end: string,
    extra: Partial<SchedulerEvent> = {}
): SchedulerEvent {
    return { id, title: id, start: at(start), end: at(end), ...extra }
}

export function week(startDay: string): DateRange {
    const start = at(`${startDay}T00:00`)
    return { start, end: start.add({ days: 7 }) }
}

export const scheduler: SchedulerContext = {
    timeZone: ZONE,
    locale: 'en-US',
    weekStartsOn: 1,
    holidays: [],
    labels: {} as SchedulerContext['labels'],
    now: at('2026-09-09T12:00')
}

export function contextFor(range: DateRange, columnsPerRow?: number, maxLanes = 3): LayoutContext {
    const days = eachDay(range)
    return {
        scale: createTimeScale({ slotMinutes: 30, slotHeight: 20 }),
        days,
        columnsPerRow: columnsPerRow ?? days.length,
        maxLanes,
        scheduler
    }
}

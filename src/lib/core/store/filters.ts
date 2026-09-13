import type { EventColor, SchedulerCalendar, SchedulerEvent } from '../../types/event.types.js'

const DEFAULT_COLOR: EventColor = 'primary'

export interface EventFilterOptions<T> {
    readonly hiddenCalendars: readonly string[]
    readonly search: string
    readonly locale: string
    readonly filter?: (event: SchedulerEvent<T>) => boolean
}

export function createEventFilter<T>(
    options: EventFilterOptions<T>
): (event: SchedulerEvent<T>) => boolean {
    const hidden = new Set(options.hiddenCalendars)
    const query = fold(options.search.trim(), options.locale)
    return (event) =>
        !(event.calendarId !== undefined && hidden.has(event.calendarId)) &&
        (query === '' || fold(event.title, options.locale).includes(query)) &&
        (options.filter?.(event) ?? true)
}

export function eventColor(
    event: Pick<SchedulerEvent, 'color' | 'calendarId'>,
    calendars: readonly SchedulerCalendar[]
): EventColor {
    if (event.color) return event.color
    return calendars.find((calendar) => calendar.id === event.calendarId)?.color ?? DEFAULT_COLOR
}

function fold(text: string, locale: string): string {
    return text
        .normalize('NFD')
        .replace(/\p{M}/gu, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .toLocaleLowerCase(locale)
}

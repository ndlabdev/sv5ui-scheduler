import type { EventInput, SchedulerEvent } from '../../types/event.types.js'
import type { TimeZoneId } from '../../types/range.types.js'
import type { RecurrenceRule, RecurrenceRuleInput } from '../../types/recurrence.types.js'
import { isAfter, toZoned } from '../time/zone.js'

export function normalizeEvent<T>(input: EventInput<T>, timeZone: TimeZoneId): SchedulerEvent<T> {
    const start = toZoned(input.start, timeZone)
    const end = toZoned(input.end, timeZone)
    if (!isAfter(end, start)) {
        throw new RangeError(`Event ${input.id} must end after it starts`)
    }
    const { recurrence, ...rest } = input
    const event: SchedulerEvent<T> = { ...rest, start, end }
    if (recurrence) event.recurrence = normalizeRecurrence(recurrence, timeZone)
    return event
}

export function normalizeEvents<T>(
    inputs: readonly EventInput<T>[],
    timeZone: TimeZoneId
): SchedulerEvent<T>[] {
    return inputs.map((input) => normalizeEvent(input, timeZone))
}

function normalizeRecurrence(input: RecurrenceRuleInput, timeZone: TimeZoneId): RecurrenceRule {
    const { until, exDates, rDates, ...rest } = input
    const rule: RecurrenceRule = { ...rest }
    if (until !== undefined) rule.until = toZoned(until, timeZone)
    if (exDates) rule.exDates = exDates.map((date) => toZoned(date, timeZone))
    if (rDates) rule.rDates = rDates.map((date) => toZoned(date, timeZone))
    return rule
}

const COMPARED_FIELDS = [
    'title',
    'allDay',
    'resourceId',
    'editable',
    'background',
    'color'
] as const

export function isEditable(event: Pick<SchedulerEvent, 'editable' | 'background'>): boolean {
    return event.editable !== false && event.background !== true
}

export function isSameEvent(a: SchedulerEvent, b: SchedulerEvent): boolean {
    if (a.id !== b.id) return false
    if (a.start.compare(b.start) !== 0 || a.end.compare(b.end) !== 0) return false
    return COMPARED_FIELDS.every((field) => (a[field] ?? undefined) === (b[field] ?? undefined))
}

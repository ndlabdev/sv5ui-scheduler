import type { ZonedDateTime } from '@internationalized/date'
import type { EventInput, SchedulerEvent } from '../../types/event.types.js'
import type { TimeZoneId, WeekDay } from '../../types/range.types.js'
import type {
    OrdinalWeekDay,
    RecurrenceRule,
    RecurrenceRuleInput
} from '../../types/recurrence.types.js'
import { isAfter, toZoned } from '../time/zone.js'
import { warnOnce } from '../utils/dev.js'

export function normalizeEvent<T>(input: EventInput<T>, timeZone: TimeZoneId): SchedulerEvent<T> {
    const zone = seriesZone(input, timeZone)
    const start = toZoned(input.start, zone)
    const end = toZoned(input.end, zone)
    if (!isAfter(end, start)) {
        throw new RangeError(`Event ${input.id} must end after it starts`)
    }
    const { recurrence, ...rest } = input
    const event: SchedulerEvent<T> = { ...rest, start, end }
    if (recurrence) event.recurrence = normalizeRecurrence(recurrence, zone)
    return event
}

export function normalizeEvents<T>(
    inputs: readonly EventInput<T>[],
    timeZone: TimeZoneId
): SchedulerEvent<T>[] {
    const events: SchedulerEvent<T>[] = []
    for (const input of inputs) {
        try {
            events.push(normalizeEvent(input, timeZone))
        } catch (error) {
            warnOnce(
                `event:${input.id}`,
                `Event ${input.id} was skipped: ${error instanceof Error ? error.message : String(error)}`
            )
        }
    }
    return events
}

function seriesZone<T>(input: EventInput<T>, timeZone: TimeZoneId): TimeZoneId {
    return input.recurrence && typeof input.start !== 'string' ? input.start.timeZone : timeZone
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
    'calendarId',
    'editable',
    'background',
    'color'
] as const

export function isEditable(
    event: Pick<SchedulerEvent, 'editable' | 'background'>,
    enabled = true
): boolean {
    return enabled && event.editable !== false && event.background !== true
}

export function sameEventList<T>(
    a: readonly SchedulerEvent<T>[],
    b: readonly SchedulerEvent<T>[]
): boolean {
    if (a.length !== b.length) return false
    const byId = new Map(b.map((event) => [event.id, event]))
    return a.every((event) => {
        const other = byId.get(event.id)
        return other !== undefined && isSameEvent(other, event) && other.data === event.data
    })
}

export function isSameEvent(a: SchedulerEvent, b: SchedulerEvent): boolean {
    if (a.id !== b.id) return false
    if (a.start.compare(b.start) !== 0 || a.end.compare(b.end) !== 0) return false
    if (!COMPARED_FIELDS.every((field) => (a[field] ?? undefined) === (b[field] ?? undefined))) {
        return false
    }
    return sameRule(a.recurrence, b.recurrence)
}

const RULE_NUMBERS = ['interval', 'count', 'weekStart'] as const
const RULE_NUMBER_LISTS = ['bySetPos', 'byMonthDay', 'byMonth', 'byWeekNo', 'byYearDay'] as const
const RULE_DATE_LISTS = ['exDates', 'rDates'] as const

function sameRule(a: RecurrenceRule | undefined, b: RecurrenceRule | undefined): boolean {
    if (!a || !b) return a === b
    if (a.freq !== b.freq) return false
    if (RULE_NUMBERS.some((field) => a[field] !== b[field])) return false
    if (!sameInstant(a.until, b.until)) return false
    if (!sameList(a.byDay, b.byDay, sameWeekDay)) return false
    if (RULE_NUMBER_LISTS.some((field) => !sameList(a[field], b[field], Object.is))) return false
    return RULE_DATE_LISTS.every((field) => sameList(a[field], b[field], sameInstant))
}

function sameInstant(a: ZonedDateTime | undefined, b: ZonedDateTime | undefined): boolean {
    if (!a || !b) return a === b
    return a.compare(b) === 0
}

function sameWeekDay(a: WeekDay | OrdinalWeekDay, b: WeekDay | OrdinalWeekDay): boolean {
    if (typeof a === 'number' || typeof b === 'number') return a === b
    return a.day === b.day && a.ordinal === b.ordinal
}

function sameList<T>(
    a: readonly T[] | undefined,
    b: readonly T[] | undefined,
    same: (x: T, y: T) => boolean
): boolean {
    if (!a || !b) return (a?.length ?? 0) === (b?.length ?? 0)
    return a.length === b.length && a.every((item, index) => same(item, b[index]))
}

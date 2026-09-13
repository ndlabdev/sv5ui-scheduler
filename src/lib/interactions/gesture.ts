import { toCalendarDate, type ZonedDateTime } from '@internationalized/date'
import type { SchedulerEvent } from '../types/event.types.js'
import { endOfDay, startOfDay } from '../core/time/zone.js'
import { snapToSlot } from './snap.js'

const DEFAULT_DURATION_MINUTES = 60

export type GestureMode = 'create' | 'move' | 'resize'

export type ResizeEdge = 'start' | 'end'

export interface GesturePoint {
    readonly date: ZonedDateTime
    readonly allDay: boolean
    readonly keepsTime?: boolean
}

export interface DraftRange {
    readonly start: ZonedDateTime
    readonly end: ZonedDateTime
    readonly allDay: boolean
}

export interface WallOffset {
    readonly days: number
    readonly minutes: number
}

export function minutesOfDay(date: ZonedDateTime): number {
    return date.hour * 60 + date.minute
}

export function wallOffset(from: ZonedDateTime, to: ZonedDateTime): WallOffset {
    return {
        days: toCalendarDate(to).compare(toCalendarDate(from)),
        minutes: minutesOfDay(to) - minutesOfDay(from)
    }
}

export function shiftWall(date: ZonedDateTime, offset: WallOffset): ZonedDateTime {
    const byDays = offset.days === 0 ? date : date.add({ days: offset.days })
    return offset.minutes === 0 ? byDays : byDays.add({ minutes: offset.minutes })
}

export function createDraft(
    anchor: GesturePoint,
    current: GesturePoint,
    slotMinutes: number
): DraftRange {
    if (anchor.allDay) {
        const [first, last] = order(startOfDay(anchor.date), startOfDay(current.date))
        return { start: first, end: endOfDay(last), allDay: true }
    }
    const [first, last] = order(
        snapToSlot(anchor.date, slotMinutes),
        snapToSlot(current.date, slotMinutes)
    )
    const end = last.compare(first) === 0 ? first.add({ minutes: slotMinutes }) : last
    return { start: first, end, allDay: false }
}

export interface MoveOptions {
    readonly slotMinutes: number
    readonly defaultMinutes?: number
}

export function moveDraft(
    event: Pick<SchedulerEvent, 'start' | 'end' | 'allDay'>,
    anchor: GesturePoint,
    current: GesturePoint,
    options: MoveOptions
): DraftRange {
    const wasAllDay = event.allDay === true
    if (wasAllDay && current.allDay) return moveWholeDays(event, anchor, current)
    if (wasAllDay) {
        return dropIntoTimeGrid(
            current,
            options.slotMinutes,
            options.defaultMinutes ?? DEFAULT_DURATION_MINUTES
        )
    }
    if (current.allDay && current.keepsTime) return moveByDays(event, anchor, current)
    if (current.allDay) return dropIntoAllDay(event, anchor, current)
    return moveTimed(event, anchor, current, options.slotMinutes)
}

function moveWholeDays(
    event: Pick<SchedulerEvent, 'start' | 'end'>,
    anchor: GesturePoint,
    current: GesturePoint
): DraftRange {
    const days = wallOffset(anchor.date, current.date).days
    return {
        start: startOfDay(shiftWall(event.start, { days, minutes: 0 })),
        end: shiftWall(event.end, { days, minutes: 0 }),
        allDay: true
    }
}

function dropIntoTimeGrid(
    current: GesturePoint,
    slotMinutes: number,
    defaultMinutes: number
): DraftRange {
    const start = snapToSlot(current.date, slotMinutes)
    return { start, end: start.add({ minutes: defaultMinutes }), allDay: false }
}

function moveByDays(
    event: Pick<SchedulerEvent, 'start' | 'end'>,
    anchor: GesturePoint,
    current: GesturePoint
): DraftRange {
    const days = wallOffset(anchor.date, current.date).days
    return {
        start: shiftWall(event.start, { days, minutes: 0 }),
        end: shiftWall(event.end, { days, minutes: 0 }),
        allDay: false
    }
}

function dropIntoAllDay(
    event: Pick<SchedulerEvent, 'start' | 'end'>,
    anchor: GesturePoint,
    current: GesturePoint
): DraftRange {
    const days = wallOffset(anchor.date, current.date).days
    const start = startOfDay(shiftWall(event.start, { days, minutes: 0 }))
    const coveredDays = Math.max(wallOffset(startOfDay(event.start), endOfDay(event.end)).days, 1)
    return { start, end: startOfDay(start.add({ days: coveredDays })), allDay: true }
}

function moveTimed(
    event: Pick<SchedulerEvent, 'start' | 'end'>,
    anchor: GesturePoint,
    current: GesturePoint,
    slotMinutes: number
): DraftRange {
    const offset = wallOffset(anchor.date, current.date)
    const start = snapToSlot(shiftWall(event.start, offset), slotMinutes)
    const duration = wallOffset(event.start, event.end)
    return { start, end: shiftWall(start, duration), allDay: false }
}

export function resizeDraft(
    event: Pick<SchedulerEvent, 'start' | 'end' | 'allDay'>,
    edge: ResizeEdge,
    current: GesturePoint,
    slotMinutes: number
): DraftRange {
    const allDay = event.allDay === true
    if (!allDay && current.allDay) return resizeByDays(event, edge, current, slotMinutes)
    if (edge === 'end') {
        const floor = allDay ? endOfDay(event.start) : event.start.add({ minutes: slotMinutes })
        const target = allDay ? endOfDay(current.date) : snapToSlot(current.date, slotMinutes)
        return { start: event.start, end: latest(target, floor), allDay }
    }
    const ceiling = allDay
        ? startOfDay(event.end.subtract({ days: 1 }))
        : event.end.subtract({ minutes: slotMinutes })
    const target = allDay ? startOfDay(current.date) : snapToSlot(current.date, slotMinutes)
    return { start: earliest(target, ceiling), end: event.end, allDay }
}

function resizeByDays(
    event: Pick<SchedulerEvent, 'start' | 'end'>,
    edge: ResizeEdge,
    current: GesturePoint,
    slotMinutes: number
): DraftRange {
    if (edge === 'end') {
        const days = wallOffset(startOfDay(event.end), startOfDay(current.date)).days
        const target = shiftWall(event.end, { days, minutes: 0 })
        const floor = event.start.add({ minutes: slotMinutes })
        return { start: event.start, end: latest(target, floor), allDay: false }
    }
    const days = wallOffset(startOfDay(event.start), startOfDay(current.date)).days
    const target = shiftWall(event.start, { days, minutes: 0 })
    const ceiling = event.end.subtract({ minutes: slotMinutes })
    return { start: earliest(target, ceiling), end: event.end, allDay: false }
}

export function applyDraft<T>(event: SchedulerEvent<T>, draft: DraftRange): SchedulerEvent<T> {
    return { ...event, start: draft.start, end: draft.end, allDay: draft.allDay }
}

export function isUnchanged(
    event: Pick<SchedulerEvent, 'start' | 'end' | 'allDay'>,
    draft: DraftRange
): boolean {
    return (
        event.start.compare(draft.start) === 0 &&
        event.end.compare(draft.end) === 0 &&
        (event.allDay === true) === draft.allDay
    )
}

function order(a: ZonedDateTime, b: ZonedDateTime): [ZonedDateTime, ZonedDateTime] {
    return a.compare(b) <= 0 ? [a, b] : [b, a]
}

function latest(a: ZonedDateTime, b: ZonedDateTime): ZonedDateTime {
    return a.compare(b) >= 0 ? a : b
}

function earliest(a: ZonedDateTime, b: ZonedDateTime): ZonedDateTime {
    return a.compare(b) <= 0 ? a : b
}

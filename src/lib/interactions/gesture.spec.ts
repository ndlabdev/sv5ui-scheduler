import { parseZonedDateTime } from '@internationalized/date'
import { describe, expect, it } from 'vitest'
import type { SchedulerEvent } from '../types/event.types.js'
import {
    applyDraft,
    createDraft,
    isUnchanged,
    minutesOfDay,
    moveDraft,
    resizeDraft,
    shiftWall,
    wallOffset,
    type GesturePoint
} from './gesture.js'

const ZONE = 'America/New_York'
const at = (iso: string) => parseZonedDateTime(`${iso}[${ZONE}]`)
const point = (iso: string, allDay = false): GesturePoint => ({ date: at(iso), allDay })
const iso = (date: { toString(): string }) => date.toString().slice(0, 16)
const event = (start: string, end: string, allDay?: boolean): SchedulerEvent => ({
    id: 'a',
    title: 'a',
    start: at(start),
    end: at(end),
    ...(allDay === undefined ? {} : { allDay })
})

describe('wall offset', () => {
    it('counts calendar days and clock minutes separately', () => {
        expect(wallOffset(at('2026-09-09T09:00'), at('2026-09-11T10:30'))).toEqual({
            days: 2,
            minutes: 90
        })
        expect(wallOffset(at('2026-09-11T10:30'), at('2026-09-09T09:00'))).toEqual({
            days: -2,
            minutes: -90
        })
    })

    it('is unaffected by a DST change between the two dates', () => {
        expect(wallOffset(at('2026-03-07T09:00'), at('2026-03-09T09:00'))).toEqual({
            days: 2,
            minutes: 0
        })
    })

    it('shifts a date by an offset in wall clock terms', () => {
        expect(iso(shiftWall(at('2026-03-07T09:00'), { days: 1, minutes: 0 }))).toBe(
            '2026-03-08T09:00'
        )
        expect(minutesOfDay(at('2026-09-09T09:30'))).toBe(570)
    })
})

describe('createDraft', () => {
    const slot = 30

    it('makes one slot when the pointer never moved', () => {
        const draft = createDraft(point('2026-09-09T09:00'), point('2026-09-09T09:00'), slot)
        expect(iso(draft.start)).toBe('2026-09-09T09:00')
        expect(iso(draft.end)).toBe('2026-09-09T09:30')
        expect(draft.allDay).toBe(false)
    })

    it('snaps both ends to the slot grid', () => {
        const draft = createDraft(point('2026-09-09T09:07'), point('2026-09-09T10:24'), slot)
        expect(iso(draft.start)).toBe('2026-09-09T09:00')
        expect(iso(draft.end)).toBe('2026-09-09T10:30')
    })

    it('orders the range when dragging upwards', () => {
        const draft = createDraft(point('2026-09-09T11:00'), point('2026-09-09T09:00'), slot)
        expect(iso(draft.start)).toBe('2026-09-09T09:00')
        expect(iso(draft.end)).toBe('2026-09-09T11:00')
    })

    it('spans whole days when the drag starts in the all-day area', () => {
        const draft = createDraft(
            point('2026-09-09T13:00', true),
            point('2026-09-11T04:00', true),
            slot
        )
        expect(iso(draft.start)).toBe('2026-09-09T00:00')
        expect(iso(draft.end)).toBe('2026-09-12T00:00')
        expect(draft.allDay).toBe(true)
    })

    it('never lands inside a skipped hour', () => {
        const draft = createDraft(point('2026-03-08T01:50'), point('2026-03-08T01:50'), slot)
        expect(draft.start.hour).toBe(3)
        expect(iso(draft.end)).toBe('2026-03-08T03:30')
    })
})

describe('moveDraft', () => {
    const slot = 30

    it('keeps the duration when moving within a day', () => {
        const draft = moveDraft(
            event('2026-09-09T09:00', '2026-09-09T10:30'),
            point('2026-09-09T09:00'),
            point('2026-09-09T14:00'),
            { slotMinutes: slot }
        )
        expect(iso(draft.start)).toBe('2026-09-09T14:00')
        expect(iso(draft.end)).toBe('2026-09-09T15:30')
    })

    it('moves across days, keeping the clock time offset', () => {
        const draft = moveDraft(
            event('2026-09-09T09:00', '2026-09-09T10:00'),
            point('2026-09-09T09:30'),
            point('2026-09-11T13:30'),
            { slotMinutes: slot }
        )
        expect(iso(draft.start)).toBe('2026-09-11T13:00')
        expect(iso(draft.end)).toBe('2026-09-11T14:00')
    })

    it('grabs the event where the pointer took it, not by its start', () => {
        const draft = moveDraft(
            event('2026-09-09T09:00', '2026-09-09T11:00'),
            point('2026-09-09T10:00'),
            point('2026-09-09T10:00'),
            { slotMinutes: slot }
        )
        expect(iso(draft.start)).toBe('2026-09-09T09:00')
    })

    it('keeps a multi-day event the same length', () => {
        const draft = moveDraft(
            event('2026-09-09T22:00', '2026-09-11T02:00'),
            point('2026-09-09T22:00'),
            point('2026-09-10T22:00'),
            { slotMinutes: slot }
        )
        expect(iso(draft.start)).toBe('2026-09-10T22:00')
        expect(iso(draft.end)).toBe('2026-09-12T02:00')
    })

    it('keeps the clock time when crossing a DST change', () => {
        const draft = moveDraft(
            event('2026-03-07T09:00', '2026-03-07T10:00'),
            point('2026-03-07T09:00'),
            point('2026-03-08T09:00'),
            { slotMinutes: slot }
        )
        expect(iso(draft.start)).toBe('2026-03-08T09:00')
        expect(iso(draft.end)).toBe('2026-03-08T10:00')
    })

    it('moves an all-day event by whole days only', () => {
        const draft = moveDraft(
            event('2026-09-09T00:00', '2026-09-11T00:00', true),
            point('2026-09-09T00:00', true),
            point('2026-09-10T13:00', true),
            { slotMinutes: slot }
        )
        expect(iso(draft.start)).toBe('2026-09-10T00:00')
        expect(iso(draft.end)).toBe('2026-09-12T00:00')
        expect(draft.allDay).toBe(true)
    })

    it('turns a timed event into a whole day when dropped in the all-day area', () => {
        const draft = moveDraft(
            event('2026-09-09T09:00', '2026-09-09T10:00'),
            point('2026-09-09T09:00'),
            point('2026-09-10T00:00', true),
            { slotMinutes: slot }
        )
        expect(draft.allDay).toBe(true)
        expect(iso(draft.start)).toBe('2026-09-10T00:00')
        expect(iso(draft.end)).toBe('2026-09-11T00:00')
    })

    it('keeps the number of days a timed event touched when it becomes all day', () => {
        const draft = moveDraft(
            event('2026-09-09T22:00', '2026-09-11T02:00'),
            point('2026-09-09T22:00'),
            point('2026-09-09T22:00', true),
            { slotMinutes: slot }
        )
        expect(iso(draft.start)).toBe('2026-09-09T00:00')
        expect(iso(draft.end)).toBe('2026-09-12T00:00')
    })

    it('turns an all-day event into a timed one at the drop time', () => {
        const draft = moveDraft(
            event('2026-09-09T00:00', '2026-09-11T00:00', true),
            point('2026-09-09T00:00', true),
            point('2026-09-10T14:07'),
            { slotMinutes: slot }
        )
        expect(draft.allDay).toBe(false)
        expect(iso(draft.start)).toBe('2026-09-10T14:00')
        expect(iso(draft.end)).toBe('2026-09-10T15:00')
    })

    it('honours the default duration for that conversion', () => {
        const draft = moveDraft(
            event('2026-09-09T00:00', '2026-09-10T00:00', true),
            point('2026-09-09T00:00', true),
            point('2026-09-10T14:00'),
            { slotMinutes: slot, defaultMinutes: 30 }
        )
        expect(iso(draft.end)).toBe('2026-09-10T14:30')
    })
})

describe('moveDraft on a day cell that keeps time', () => {
    const options = { slotMinutes: 30 }
    const dayCell = (iso: string): GesturePoint => ({
        date: at(iso),
        allDay: true,
        keepsTime: true
    })

    it('shifts a timed event by whole days and keeps its clock time', () => {
        const draft = moveDraft(
            event('2026-09-09T13:15', '2026-09-09T14:45'),
            dayCell('2026-09-09T00:00'),
            dayCell('2026-09-16T00:00'),
            options
        )
        expect(iso(draft.start)).toBe('2026-09-16T13:15')
        expect(iso(draft.end)).toBe('2026-09-16T14:45')
        expect(draft.allDay).toBe(false)
    })

    it('still turns a timed event all-day when dropped on the all-day row', () => {
        const draft = moveDraft(
            event('2026-09-09T13:15', '2026-09-09T14:45'),
            point('2026-09-09T00:00', true),
            point('2026-09-16T00:00', true),
            options
        )
        expect(draft.allDay).toBe(true)
        expect(iso(draft.start)).toBe('2026-09-16T00:00')
    })

    it('moves an all-day event by days either way', () => {
        const draft = moveDraft(
            event('2026-09-09T00:00', '2026-09-11T00:00', true),
            dayCell('2026-09-10T00:00'),
            dayCell('2026-09-17T00:00'),
            options
        )
        expect(iso(draft.start)).toBe('2026-09-16T00:00')
        expect(iso(draft.end)).toBe('2026-09-18T00:00')
        expect(draft.allDay).toBe(true)
    })
})

describe('resizeDraft', () => {
    const slot = 30
    const base = event('2026-09-09T09:00', '2026-09-09T10:00')

    it('moves the end and leaves the start alone', () => {
        const draft = resizeDraft(base, 'end', point('2026-09-09T12:10'), slot)
        expect(iso(draft.start)).toBe('2026-09-09T09:00')
        expect(iso(draft.end)).toBe('2026-09-09T12:00')
    })

    it('moves the start and leaves the end alone', () => {
        const draft = resizeDraft(base, 'start', point('2026-09-09T08:05'), slot)
        expect(iso(draft.start)).toBe('2026-09-09T08:00')
        expect(iso(draft.end)).toBe('2026-09-09T10:00')
    })

    it('never lets the end cross the start', () => {
        const draft = resizeDraft(base, 'end', point('2026-09-09T07:00'), slot)
        expect(iso(draft.end)).toBe('2026-09-09T09:30')
    })

    it('never lets the start cross the end', () => {
        const draft = resizeDraft(base, 'start', point('2026-09-09T14:00'), slot)
        expect(iso(draft.start)).toBe('2026-09-09T09:30')
    })

    it('resizes past midnight', () => {
        const draft = resizeDraft(base, 'end', point('2026-09-10T01:00'), slot)
        expect(iso(draft.end)).toBe('2026-09-10T01:00')
    })

    it('resizes an all-day event by whole days, keeping at least one', () => {
        const whole = event('2026-09-09T00:00', '2026-09-10T00:00', true)
        expect(iso(resizeDraft(whole, 'end', point('2026-09-11T15:00', true), slot).end)).toBe(
            '2026-09-12T00:00'
        )
        expect(iso(resizeDraft(whole, 'end', point('2026-09-05T15:00', true), slot).end)).toBe(
            '2026-09-10T00:00'
        )
        expect(iso(resizeDraft(whole, 'start', point('2026-09-07T15:00', true), slot).start)).toBe(
            '2026-09-07T00:00'
        )
        expect(iso(resizeDraft(whole, 'start', point('2026-09-20T15:00', true), slot).start)).toBe(
            '2026-09-09T00:00'
        )
    })
})

describe('applyDraft and isUnchanged', () => {
    const base = event('2026-09-09T09:00', '2026-09-09T10:00')

    it('copies the range onto the event and keeps everything else', () => {
        const draft = moveDraft(base, point('2026-09-09T09:00'), point('2026-09-09T11:00'), {
            slotMinutes: 30
        })
        const moved = applyDraft({ ...base, title: 'Kept', data: { n: 1 } }, draft)
        expect(moved.title).toBe('Kept')
        expect(moved.data).toEqual({ n: 1 })
        expect(iso(moved.start)).toBe('2026-09-09T11:00')
    })

    it('detects a gesture that ended where it began', () => {
        const still = moveDraft(base, point('2026-09-09T09:00'), point('2026-09-09T09:00'), {
            slotMinutes: 30
        })
        const moved = moveDraft(base, point('2026-09-09T09:00'), point('2026-09-09T09:30'), {
            slotMinutes: 30
        })
        expect(isUnchanged(base, still)).toBe(true)
        expect(isUnchanged(base, moved)).toBe(false)
    })
})

import { parseZonedDateTime } from '@internationalized/date'
import { describe, expect, it } from 'vitest'
import type { SchedulerEvent } from '../../types/event.types.js'
import { createEventFilter, eventColor } from './filters.js'

const at = (iso: string) => parseZonedDateTime(`${iso}[UTC]`)
const event = (id: string, extra: Partial<SchedulerEvent> = {}): SchedulerEvent => ({
    id,
    title: id,
    start: at('2026-09-09T09:00'),
    end: at('2026-09-09T10:00'),
    ...extra
})
const base = { hiddenCalendars: [], search: '', locale: 'en-US' }

describe('createEventFilter', () => {
    it('keeps everything with no criteria', () => {
        const keep = createEventFilter(base)
        expect(keep(event('a'))).toBe(true)
        expect(keep(event('b', { calendarId: 'work' }))).toBe(true)
    })

    it('hides events of hidden calendars but never events without a calendar', () => {
        const keep = createEventFilter({ ...base, hiddenCalendars: ['work'] })
        expect(keep(event('a', { calendarId: 'work' }))).toBe(false)
        expect(keep(event('b', { calendarId: 'home' }))).toBe(true)
        expect(keep(event('c'))).toBe(true)
    })

    it('matches the title ignoring case, surrounding spaces and accents', () => {
        const keep = createEventFilter({ ...base, search: '  HOP nhom ', locale: 'vi-VN' })
        expect(keep(event('a', { title: 'Họp nhóm sáng' }))).toBe(true)
        expect(keep(event('b', { title: 'Ăn trưa' }))).toBe(false)
        const dd = createEventFilter({ ...base, search: 'di choi', locale: 'vi-VN' })
        expect(dd(event('c', { title: 'Đi chơi' }))).toBe(true)
    })

    it('applies the custom predicate after the built-in criteria', () => {
        const keep = createEventFilter({
            ...base,
            hiddenCalendars: ['work'],
            filter: (candidate) => candidate.id !== 'b'
        })
        expect(keep(event('a'))).toBe(true)
        expect(keep(event('b'))).toBe(false)
        expect(keep(event('c', { calendarId: 'work' }))).toBe(false)
    })
})

describe('eventColor', () => {
    const calendars = [
        { id: 'work', title: 'Work', color: 'info' as const },
        { id: 'plain', title: 'Plain' }
    ]

    it('prefers the event colour, then the calendar colour, then primary', () => {
        expect(eventColor({ color: 'error', calendarId: 'work' }, calendars)).toBe('error')
        expect(eventColor({ calendarId: 'work' }, calendars)).toBe('info')
        expect(eventColor({ calendarId: 'plain' }, calendars)).toBe('primary')
        expect(eventColor({ calendarId: 'missing' }, calendars)).toBe('primary')
        expect(eventColor({}, [])).toBe('primary')
    })
})

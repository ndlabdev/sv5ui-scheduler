import { parseZonedDateTime } from '@internationalized/date'
import { describe, expect, it } from 'vitest'
import { createTimeScale } from '../core/time/scale.js'
import { resolveHit, type ColumnRect } from './hit-test.js'

const day = (iso: string) => parseZonedDateTime(`${iso}T00:00[UTC]`)
const days = [day('2026-09-07'), day('2026-09-08')]
const scale = createTimeScale({ slotMinutes: 30, slotHeight: 20 })
const column = (dayIndex: number, left: number, allDay = false): ColumnRect => ({
    dayIndex,
    left,
    right: left + 100,
    top: allDay ? 0 : 50,
    bottom: allDay ? 50 : 50 + scale.dayHeight,
    originTop: allDay ? 0 : 50,
    allDay,
    keepsTime: false
})
const columns = [column(0, 0, true), column(1, 100, true), column(0, 0), column(1, 100)]

describe('resolveHit', () => {
    it('maps a point in a day column to a snapped time on that day', () => {
        const hit = resolveHit({ clientX: 150, clientY: 50 + 18 * 20 + 7, columns, days, scale })
        expect(hit?.dayIndex).toBe(1)
        expect(hit?.allDay).toBe(false)
        expect(hit?.date.toString()).toBe('2026-09-08T09:00:00+00:00[UTC]')
    })

    it('maps a point in the all-day area to the day start', () => {
        const hit = resolveHit({ clientX: 10, clientY: 25, columns, days, scale })
        expect(hit).toMatchObject({ dayIndex: 0, allDay: true })
        expect(hit?.date.toString()).toBe(days[0].toString())
    })

    it('returns null outside every column', () => {
        expect(resolveHit({ clientX: 500, clientY: 100, columns, days, scale })).toBeNull()
        expect(resolveHit({ clientX: 10, clientY: 5000, columns, days, scale })).toBeNull()
    })

    it('carries the event id it was given', () => {
        const hit = resolveHit({ clientX: 10, clientY: 60, columns, days, scale, eventId: 'a' })
        expect(hit?.eventId).toBe('a')
    })
})

describe('resolveHit on a clipped column', () => {
    it('maps pixels from the column origin, not from the visible edge', () => {
        const clipped: ColumnRect = {
            dayIndex: 0,
            left: 0,
            right: 100,
            top: 250,
            bottom: 650,
            originTop: 50,
            allDay: false,
            keepsTime: false
        }
        const hit = resolveHit({
            clientX: 50,
            clientY: 250 + 20 * 6,
            columns: [clipped],
            days,
            scale
        })
        expect(hit?.date.hour).toBe(8)
        expect(
            resolveHit({ clientX: 50, clientY: 100, columns: [clipped], days, scale })
        ).toBeNull()
    })
})

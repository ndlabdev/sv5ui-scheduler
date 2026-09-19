import { parseZonedDateTime } from '@internationalized/date'
import { describe, expect, it } from 'vitest'
import { isSameDay, max, min, minutesBetween, toZoned } from './zone.js'

const ZONE = 'Asia/Ho_Chi_Minh'

describe('toZoned', () => {
    it('keeps a value already in the target zone', () => {
        const date = parseZonedDateTime('2026-09-12T10:00[Asia/Ho_Chi_Minh]')
        expect(toZoned(date, ZONE)).toBe(date)
    })

    it('converts a value from another zone to the same instant', () => {
        const date = parseZonedDateTime('2026-09-12T03:00[UTC]')
        const converted = toZoned(date, ZONE)
        expect(converted.toString()).toBe('2026-09-12T10:00:00+07:00[Asia/Ho_Chi_Minh]')
        expect(minutesBetween(date, converted)).toBe(0)
    })

    it('reads a naive date-time as local wall time', () => {
        expect(toZoned('2026-09-12T10:00', ZONE).toString()).toBe(
            '2026-09-12T10:00:00+07:00[Asia/Ho_Chi_Minh]'
        )
    })

    it('reads a date-only string as local midnight', () => {
        expect(toZoned('2026-09-12', ZONE).toString()).toBe(
            '2026-09-12T00:00:00+07:00[Asia/Ho_Chi_Minh]'
        )
    })

    it('reads a UTC instant and converts it', () => {
        expect(toZoned('2026-09-12T03:00:00Z', ZONE).toString()).toBe(
            '2026-09-12T10:00:00+07:00[Asia/Ho_Chi_Minh]'
        )
    })

    it('reads an offset instant and converts it', () => {
        expect(toZoned('2026-09-12T05:00:00+02:00', ZONE).toString()).toBe(
            '2026-09-12T10:00:00+07:00[Asia/Ho_Chi_Minh]'
        )
    })

    it('reads a bracketed zone string and converts it', () => {
        expect(toZoned('2026-09-12T03:00[UTC]', ZONE).toString()).toBe(
            '2026-09-12T10:00:00+07:00[Asia/Ho_Chi_Minh]'
        )
    })

    it('rejects text that is not a date', () => {
        expect(() => toZoned('tomorrow', ZONE)).toThrow()
    })
})

describe('comparison helpers', () => {
    const early = parseZonedDateTime('2026-09-12T08:00[UTC]')
    const late = parseZonedDateTime('2026-09-12T20:00[UTC]')

    it('picks min and max by instant', () => {
        expect(min(late, early)).toBe(early)
        expect(max(early, late)).toBe(late)
    })

    it('compares calendar days in the value zone', () => {
        expect(isSameDay(early, late)).toBe(true)
        expect(isSameDay(early, late.add({ hours: 4 }))).toBe(false)
    })
})

import { parseZonedDateTime } from '@internationalized/date'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { resetWarnings } from '../utils/dev.js'
import { createTimeScale } from './scale.js'

const day = parseZonedDateTime('2026-09-09T00:00[Asia/Ho_Chi_Minh]')
const at = (hour: number, minute = 0) => day.set({ hour, minute })

afterEach(() => {
    resetWarnings()
    vi.restoreAllMocks()
})

describe('createTimeScale', () => {
    it('maps the whole day by default', () => {
        const scale = createTimeScale({ slotMinutes: 30, slotHeight: 24 })
        expect([scale.startHour, scale.endHour]).toEqual([0, 24])
        expect(scale.dayHeight).toBe(1152)
        expect(scale.toPixel(at(9))).toBe(432)
        expect(scale.toDate(432, day).hour).toBe(9)
        expect(scale.toDate(5000, day).toString()).toBe(day.add({ days: 1 }).toString())
    })

    it('measures pixels from the first visible hour', () => {
        const scale = createTimeScale({
            slotMinutes: 30,
            slotHeight: 24,
            startHour: 7,
            endHour: 22
        })
        expect([scale.startHour, scale.endHour]).toEqual([7, 22])
        expect(scale.dayHeight).toBe(15 * 48)
        expect(scale.toPixel(at(7))).toBe(0)
        expect(scale.toPixel(at(9, 30))).toBe(120)
        expect(scale.toPixel(at(6))).toBe(-48)
    })

    it('keeps dates read from pixels inside the visible hours', () => {
        const scale = createTimeScale({
            slotMinutes: 30,
            slotHeight: 24,
            startHour: 7,
            endHour: 22
        })
        expect(scale.toDate(0, day).hour).toBe(7)
        expect(scale.toDate(-100, day).hour).toBe(7)
        expect(scale.toDate(120, day).toString()).toBe(at(9, 30).toString())
        const last = scale.toDate(10000, day)
        expect([last.hour, last.minute]).toEqual([22, 0])
    })

    it('falls back to the whole day for an invalid window and reports it once', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
        const scale = createTimeScale({ startHour: 20, endHour: 8 })
        expect([scale.startHour, scale.endHour]).toEqual([0, 24])
        createTimeScale({ startHour: 20, endHour: 8 })
        expect(warn).toHaveBeenCalledTimes(1)
    })
})

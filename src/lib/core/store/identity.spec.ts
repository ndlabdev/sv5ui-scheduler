import { parseZonedDateTime, toTimeZone } from '@internationalized/date'
import { describe, expect, it } from 'vitest'
import type { SchedulerEvent } from '../../types/event.types.js'
import { isUnchanged, keepUnchanged } from './identity.js'

const at = (iso: string) => parseZonedDateTime(`2026-09-12T${iso}[UTC]`)
const event = (id: string, extra: Partial<SchedulerEvent> = {}): SchedulerEvent => ({
    id,
    title: id,
    start: at('09:00'),
    end: at('10:00'),
    ...extra
})

describe('isUnchanged', () => {
    it('accepts a copy with equal values', () => {
        expect(
            isUnchanged(event('a', { color: 'success' }), event('a', { color: 'success' }))
        ).toBe(true)
    })

    it('rejects the same instant in another time zone', () => {
        const moved = event('a', {
            start: toTimeZone(at('09:00'), 'Asia/Ho_Chi_Minh'),
            end: toTimeZone(at('10:00'), 'Asia/Ho_Chi_Minh')
        })
        expect(isUnchanged(event('a'), moved)).toBe(false)
    })

    it('rejects a changed field, an added field and a different payload', () => {
        expect(isUnchanged(event('a'), event('a', { title: 'b' }))).toBe(false)
        expect(isUnchanged(event('a'), event('a', { seriesId: 's' }))).toBe(false)
        expect(isUnchanged(event('a', { data: { n: 1 } }), event('a', { data: { n: 1 } }))).toBe(
            false
        )
    })

    it('compares recurrence rules by value', () => {
        const rule = () => ({
            freq: 'weekly' as const,
            byDay: [1 as const],
            exDates: [at('09:00')]
        })
        expect(
            isUnchanged(event('a', { recurrence: rule() }), event('a', { recurrence: rule() }))
        ).toBe(true)
        expect(
            isUnchanged(
                event('a', { recurrence: rule() }),
                event('a', { recurrence: { ...rule(), count: 3 } })
            )
        ).toBe(false)
    })
})

describe('keepUnchanged', () => {
    it('hands back the previous object for every event whose values did not change', () => {
        const kept = event('a')
        const changed = event('b')
        const next = keepUnchanged(
            [event('a'), event('b', { title: 'new' }), event('c')],
            new Map([
                ['a', kept],
                ['b', changed]
            ])
        )
        expect(next[0]).toBe(kept)
        expect(next[1]).not.toBe(changed)
        expect(next[1].title).toBe('new')
        expect(next[2].id).toBe('c')
    })
})

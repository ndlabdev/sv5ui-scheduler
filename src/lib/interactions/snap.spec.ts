import { parseZonedDateTime } from '@internationalized/date'
import { describe, expect, it } from 'vitest'
import { snapToSlot } from './snap.js'

const at = (time: string) => parseZonedDateTime(`2026-09-12T${time}[America/New_York]`)

describe('snapToSlot', () => {
    it('rounds to the nearest slot boundary', () => {
        expect(snapToSlot(at('09:14'), 30).toString()).toBe(at('09:00').toString())
        expect(snapToSlot(at('09:16'), 30).toString()).toBe(at('09:30').toString())
        expect(snapToSlot(at('09:07:40'), 15).toString()).toBe(at('09:15').toString())
    })

    it('rolls over to the next midnight past the last slot', () => {
        expect(snapToSlot(at('23:50'), 30).toString()).toBe(
            '2026-09-13T00:00:00-04:00[America/New_York]'
        )
    })

    it('never lands in a skipped hour', () => {
        const snapped = snapToSlot(parseZonedDateTime('2026-03-08T01:55[America/New_York]'), 30)
        expect(snapped.hour).toBe(3)
        expect(snapped.minute).toBe(0)
    })
})

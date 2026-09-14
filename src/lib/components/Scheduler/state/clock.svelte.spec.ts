import { flushSync } from 'svelte'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ZONE } from '../../../../tests/fixtures/dom.js'
import { SchedulerClock } from './clock.svelte.js'

function start(iso: string) {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(iso))
    let clock!: SchedulerClock
    const stop = $effect.root(() => {
        clock = new SchedulerClock(() => ZONE)
    })
    flushSync()
    return { clock, stop }
}

afterEach(() => vi.useRealTimers())

describe('SchedulerClock', () => {
    it('reads the current time in the scheduler time zone', () => {
        const { clock, stop } = start('2026-09-09T02:15:00Z')
        expect(clock.now.timeZone).toBe(ZONE)
        expect(clock.now.hour).toBe(9)
        expect(clock.now.minute).toBe(15)
        expect(clock.today.hour).toBe(0)
        expect(clock.today.day).toBe(9)
        stop()
    })

    it('ticks every minute and keeps the same today until the day changes', () => {
        const { clock, stop } = start('2026-09-09T16:58:00Z')
        const today = clock.today
        vi.advanceTimersByTime(60000)
        flushSync()
        expect(clock.now.minute).toBe(59)
        expect(clock.today).toBe(today)
        vi.advanceTimersByTime(60000)
        flushSync()
        expect(clock.now.hour).toBe(0)
        expect(clock.today).not.toBe(today)
        expect(clock.today.day).toBe(10)
        stop()
    })

    it('stops ticking once destroyed', () => {
        const { clock, stop } = start('2026-09-09T02:15:00Z')
        stop()
        vi.advanceTimersByTime(180000)
        flushSync()
        expect(clock.now.minute).toBe(15)
    })
})

import type { ZonedDateTime } from '@internationalized/date'
import { untrack } from 'svelte'
import { isSameDay, nowIn, startOfDay, toZoned } from '../../../core/time/zone.js'
import type { TimeZoneId } from '../../../types/range.types.js'

const TICK_MS = 60000

export class SchedulerClock {
    readonly #timeZone: () => TimeZoneId
    #instant: ZonedDateTime
    #lastToday: ZonedDateTime | null = null

    readonly now = $derived.by(() => toZoned(this.#instant, this.#timeZone()))

    readonly today = $derived.by(() => {
        const day = startOfDay(this.now)
        if (this.#lastToday && isSameDay(this.#lastToday, day)) return this.#lastToday
        this.#lastToday = day
        return day
    })

    constructor(timeZone: () => TimeZoneId) {
        this.#timeZone = timeZone
        this.#instant = $state.raw(nowIn(untrack(timeZone)))
        $effect(() => {
            const zone = timeZone()
            const id = setInterval(() => (this.#instant = nowIn(zone)), TICK_MS)
            return () => clearInterval(id)
        })
    }
}

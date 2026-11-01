import type { ZonedDateTime } from '@internationalized/date'
import { untrack } from 'svelte'
import { useInterval } from 'sv5ui'
import { isSameDay, nowIn, startOfDay, toZoned } from '../../../core/time/zone.js'
import type { TimeZoneId } from '../../../types/range.types.js'

const MINUTE_MS = 60000

function untilNextMinute(instant: ZonedDateTime): number {
    return MINUTE_MS - (instant.second * 1000 + instant.millisecond)
}

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
        useInterval(
            () => (this.#instant = nowIn(this.#timeZone())),
            () => untilNextMinute(this.#instant)
        )
    }
}

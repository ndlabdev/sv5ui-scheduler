import { getLocalTimeZone, parseZonedDateTime } from '@internationalized/date'
import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-svelte'
import { Scheduler } from '../../lib/index.js'
import type { EventInput, EventSourceFn } from '../../lib/types/index.js'
import { tap, wait } from '../fixtures/dom.js'

const utcEvent: EventInput = {
    id: 'a',
    title: 'A',
    start: '2026-09-09T09:00:00Z',
    end: '2026-09-09T10:00:00Z'
}
const date = parseZonedDateTime('2026-09-09T12:00[UTC]')
const chipText = (root: Element) =>
    root.querySelector('[data-sch-event="a"]')?.textContent?.replace(/\s+/g, ' ').trim()
const zone = (root: Element) => root.querySelector('[data-sch-zone]')

describe('time zones', () => {
    it('re-zones bound events when timeZone changes at runtime', async () => {
        const screen = render(Scheduler, {
            props: { timeZone: 'Asia/Ho_Chi_Minh', date, events: [utcEvent] }
        })
        await wait(80)
        expect(chipText(screen.container)).toBe('A 4:00 – 5:00 PM')
        await screen.rerender({ timeZone: 'Europe/London' })
        await wait(120)
        expect(chipText(screen.container)).toBe('A 10:00 – 11:00 AM')
        await screen.rerender({ timeZone: 'America/New_York' })
        await wait(120)
        expect(chipText(screen.container)).toBe('A 5:00 – 6:00 AM')
    })

    it('re-zones events from a source when timeZone changes at runtime', async () => {
        const source: EventSourceFn = async () => [utcEvent]
        const screen = render(Scheduler, { props: { timeZone: 'Asia/Ho_Chi_Minh', date, source } })
        await wait(120)
        expect(chipText(screen.container)).toBe('A 4:00 – 5:00 PM')
        await screen.rerender({ timeZone: 'Europe/London' })
        await wait(200)
        expect(chipText(screen.container)).toBe('A 10:00 – 11:00 AM')
    })

    it('names the zone in the week header and the day title, following daylight saving', async () => {
        const week = render(Scheduler, {
            props: { timeZone: 'Asia/Ho_Chi_Minh', date, events: [] }
        })
        await wait(80)
        expect(zone(week.container)?.textContent?.trim()).toBe('GMT+7')
        expect(zone(week.container)?.getAttribute('title')).toBe('Asia/Ho_Chi_Minh')
        week.unmount()

        const day = render(Scheduler, {
            props: { timeZone: 'America/New_York', date, events: [], view: 'day' }
        })
        await wait(80)
        expect(zone(day.container)?.textContent?.trim()).toBe('EDT')
        await day.rerender({ date: parseZonedDateTime('2026-12-09T12:00[UTC]') })
        await wait(120)
        expect(zone(day.container)?.textContent?.trim()).toBe('EST')
    })

    it('shows no zone label in the month grid', async () => {
        const { container } = render(Scheduler, {
            props: { timeZone: 'Asia/Ho_Chi_Minh', date, events: [], view: 'month' }
        })
        await wait(80)
        expect(zone(container)).toBeNull()
    })
})

describe('event details', () => {
    const foreign = getLocalTimeZone() === 'Asia/Tokyo' ? 'Europe/London' : 'Asia/Tokyo'
    const open = async (container: Element) => {
        tap(container.querySelector('[data-sch-event-id="a"]')!)
        await wait(300)
        return document.querySelector<HTMLElement>('[data-sch-detail="a"]')!
    }

    it('names the zone next to the time when it is not the device zone', async () => {
        const { container } = render(Scheduler, {
            props: { timeZone: foreign, date, events: [utcEvent] }
        })
        await wait(80)
        const detail = await open(container)
        const zone = detail.querySelector('[data-sch-zone]')
        expect(zone?.textContent?.trim()).toMatch(/^\(.+\)$/)
        expect(zone?.getAttribute('title')).toBe(foreign)
    })

    it('stays quiet when the scheduler shows the device zone', async () => {
        const { container } = render(Scheduler, {
            props: { timeZone: getLocalTimeZone(), date, events: [utcEvent] }
        })
        await wait(80)
        const detail = await open(container)
        expect(detail.querySelector('[data-sch-zone]')).toBeNull()
    })
})

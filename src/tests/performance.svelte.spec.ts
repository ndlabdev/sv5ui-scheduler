import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-svelte'
import { Scheduler } from '../lib/index.js'
import type { EventInput } from '../lib/types/event.types.js'
import { ZONE, anchor, frame } from './fixtures/dom.js'

const EVENTS = 500
const MOUNT_BUDGET_MS = 1500
const NAVIGATE_BUDGET_MS = 400
const pad = (value: number) => String(value).padStart(2, '0')

function week(count: number): EventInput[] {
    return Array.from({ length: count }, (_, i) => {
        const day = 7 + (i % 7)
        const startMinutes = (i * 37) % (22 * 60)
        const length = 30 + ((i * 13) % 150)
        const endMinutes = Math.min(startMinutes + length, 24 * 60 - 1)
        const at = (minutes: number) =>
            `2026-09-${pad(day)}T${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`
        return { id: `e${i}`, title: `Event ${i}`, start: at(startMinutes), end: at(endMinutes) }
    })
}

const ATTEMPTS = 3

async function timed(action: () => void | Promise<void>): Promise<number> {
    const start = performance.now()
    await action()
    await frame()
    return performance.now() - start
}

async function best(run: () => Promise<number>): Promise<number> {
    let fastest = Infinity
    for (let attempt = 0; attempt < ATTEMPTS; attempt += 1) fastest = Math.min(fastest, await run())
    return fastest
}

describe(`a week of ${EVENTS} events`, () => {
    it(`mounts within ${MOUNT_BUDGET_MS}ms and renders every event`, async () => {
        const elapsed = await best(async () => {
            let container: HTMLElement | undefined
            let unmount = () => {}
            const took = await timed(() => {
                const screen = render(Scheduler, {
                    props: { timeZone: ZONE, date: anchor, events: week(EVENTS) }
                })
                container = screen.container
                unmount = screen.unmount
                container.style.height = '720px'
            })
            expect(container!.querySelectorAll('[data-sch-event]')).toHaveLength(EVENTS)
            unmount()
            return took
        })
        expect(elapsed).toBeLessThan(MOUNT_BUDGET_MS)
    })

    it(`navigates away and back within ${NAVIGATE_BUDGET_MS}ms each`, async () => {
        const { container } = render(Scheduler, {
            props: { timeZone: ZONE, date: anchor, events: week(EVENTS) }
        })
        container.style.height = '720px'
        await frame()
        const next = container.querySelector<HTMLElement>('button[aria-label="Next"]')!
        const previous = container.querySelector<HTMLElement>('button[aria-label="Previous"]')!

        const away = await best(async () => {
            const took = await timed(() => next.click())
            expect(container.querySelectorAll('[data-sch-event]')).toHaveLength(0)
            await timed(() => previous.click())
            return took
        })
        const back = await best(async () => {
            await timed(() => next.click())
            const took = await timed(() => previous.click())
            expect(container.querySelectorAll('[data-sch-event]')).toHaveLength(EVENTS)
            return took
        })

        expect(away).toBeLessThan(NAVIGATE_BUDGET_MS)
        expect(back).toBeLessThan(NAVIGATE_BUDGET_MS)
    })
})

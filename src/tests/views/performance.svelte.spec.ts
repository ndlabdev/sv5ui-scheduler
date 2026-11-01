import { describe, expect, inject, it } from 'vitest'
import { render } from 'vitest-browser-svelte'
import { Scheduler } from '../../lib/index.js'
import type { EventInput } from '../../lib/types/event.types.js'
import type { InteractionContext, InteractionPlugin } from '../../lib/types/interaction.types.js'
import BoundScheduler from '../fixtures/BoundScheduler.svelte'
import SearchScheduler from '../fixtures/SearchScheduler.svelte'
import { ZONE, anchor, frame, settle } from '../fixtures/dom.js'

const EVENTS = 500
const MOUNT_BUDGET_MS = 1500
const NAVIGATE_BUDGET_MS = 400
const scale = inject('performanceScale')
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
        expect(elapsed).toBeLessThan(MOUNT_BUDGET_MS * scale)
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

        expect(away).toBeLessThan(NAVIGATE_BUDGET_MS * scale)
        expect(back).toBeLessThan(NAVIGATE_BUDGET_MS * scale)
    })
})

describe('changing one event of a full week', () => {
    function counting() {
        const counter = {
            calls: 0,
            days: [] as number[],
            context: null as InteractionContext | null
        }
        const plugin: InteractionPlugin = {
            name: 'attach-counter',
            attach: (context) => {
                counter.context = context
                return () => {}
            },
            attachEvent: (_context, position) => {
                counter.calls += 1
                counter.days.push(position.event.start.day)
                return () => {}
            }
        }
        return { counter, plugin }
    }

    function watch(root: Element) {
        const writes: MutationRecord[] = []
        const observer = new MutationObserver((records) => writes.push(...records))
        observer.observe(root, {
            subtree: true,
            childList: true,
            attributes: true,
            characterData: true
        })
        return () => {
            writes.push(...observer.takeRecords())
            observer.disconnect()
            return new Set(
                writes.map((record) => {
                    const node =
                        record.target instanceof Element
                            ? record.target
                            : record.target.parentElement
                    return node?.closest('[data-sch-event-id]')?.getAttribute('data-sch-event-id')
                })
            )
        }
    }

    it('redraws only the renamed chip of a bound array', async () => {
        const { counter, plugin } = counting()
        const screen = render(BoundScheduler, {
            initial: week(EVENTS),
            interactions: [plugin],
            date: anchor
        })
        await settle()
        const before = counter.calls
        const touched = watch(screen.container)

        screen.component.patch('e7', { title: 'Renamed' })
        await settle()

        expect(counter.calls - before).toBe(1)
        expect([...touched()]).toEqual(['e7'])
    })

    it('redraws only the chips of the two days a move touches', async () => {
        const { counter, plugin } = counting()
        render(Scheduler, {
            props: { timeZone: ZONE, date: anchor, events: week(EVENTS), interactions: [plugin] }
        })
        await settle()
        const event = counter.context!.events.find((candidate) => candidate.id === 'e7')!
        counter.days = []

        counter.context!.commit({
            kind: 'move',
            eventId: 'e7',
            before: event,
            after: {
                ...event,
                start: event.start.add({ days: 1 }),
                end: event.end.add({ days: 1 })
            }
        })
        await settle()

        const touchedDays = new Set([event.start.day, event.start.day + 1])
        expect(counter.days.length).toBeGreaterThan(0)
        expect(counter.days.filter((day) => !touchedDays.has(day))).toEqual([])
    })

    it('redraws nothing when a search keeps every event', async () => {
        const { counter, plugin } = counting()
        const screen = render(SearchScheduler, {
            props: { events: week(EVENTS), interactions: [plugin], date: anchor }
        })
        await settle()
        const before = counter.calls

        screen.component.type('Event')
        await settle()

        expect(counter.calls - before).toBe(0)
    })
})

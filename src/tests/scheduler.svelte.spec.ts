import { parseZonedDateTime } from '@internationalized/date'
import { describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-svelte'
import { Scheduler } from '../lib/index.js'
import type { EventInput } from '../lib/types/event.types.js'
import type { InteractionPlugin } from '../lib/types/extension.types.js'
import BoundScheduler from './fixtures/BoundScheduler.svelte'

const ZONE = 'Asia/Ho_Chi_Minh'
const anchor = parseZonedDateTime('2026-09-09T12:00[Asia/Ho_Chi_Minh]')
const input = (
    id: string,
    start: string,
    end: string,
    extra: Partial<EventInput> = {}
): EventInput => ({
    id,
    title: id,
    start,
    end,
    ...extra
})

const columns = (container: Element) => [
    ...container.querySelectorAll<HTMLElement>('[data-sch-day-index]:not([data-sch-all-day])')
]
const chips = (container: Element) => [
    ...container.querySelectorAll<HTMLElement>('[data-sch-event-id]')
]
const title = (container: Element) => container.querySelector('h2')?.textContent?.trim()
const tick = () => new Promise((resolve) => setTimeout(resolve, 0))

describe('Scheduler', () => {
    it('renders seven day columns in the week view starting on Monday', () => {
        const { container } = render(Scheduler, { timeZone: ZONE, date: anchor })
        const days = columns(container).map((c) => c.dataset.schDay)
        expect(days).toEqual([
            '2026-09-07',
            '2026-09-08',
            '2026-09-09',
            '2026-09-10',
            '2026-09-11',
            '2026-09-12',
            '2026-09-13'
        ])
        expect(title(container)).toContain('Sep 7')
    })

    it('honours weekStartsOn', () => {
        const { container } = render(Scheduler, { timeZone: ZONE, date: anchor, weekStartsOn: 0 })
        expect(columns(container)[0].dataset.schDay).toBe('2026-09-06')
    })

    it('renders one column in the day view with a long title', () => {
        const { container } = render(Scheduler, { timeZone: ZONE, date: anchor, view: 'day' })
        expect(columns(container)).toHaveLength(1)
        expect(title(container)).toBe('Wednesday, September 9, 2026')
    })

    it('places an event in its column at the pixel of its clock time', () => {
        const { container } = render(Scheduler, {
            props: {
                timeZone: ZONE,
                date: anchor,
                slotMinutes: 30,
                slotHeight: 20,
                events: [input('standup', '2026-09-09T09:00', '2026-09-09T09:30')]
            }
        })
        const [chip] = chips(container)
        expect(chip.textContent).toContain('standup')
        const wrapper = chip.parentElement as HTMLElement
        expect(wrapper.style.top).toBe(`${18 * 20}px`)
        expect(wrapper.style.height).toBe('20px')
        expect(wrapper.closest('[data-sch-day-index]')?.getAttribute('data-sch-day')).toBe(
            '2026-09-09'
        )
    })

    it('puts all-day and multi-day events in the all-day row', () => {
        const { container } = render(Scheduler, {
            props: {
                timeZone: ZONE,
                date: anchor,
                events: [
                    input('holiday', '2026-09-10', '2026-09-11', { allDay: true }),
                    input('trip', '2026-09-11T09:00', '2026-09-13T09:00')
                ]
            }
        })
        const allDay = chips(container).map(
            (c) => c.closest('[data-sch-all-day]') ?? c.closest('.pointer-events-none')
        )
        expect(allDay.every(Boolean)).toBe(true)
        expect(columns(container).flatMap((c) => chips(c))).toHaveLength(0)
    })

    it('navigates with the toolbar and keeps the view in sync', async () => {
        const screen = render(Scheduler, { timeZone: ZONE, date: anchor })
        await screen.getByRole('button', { name: 'Next' }).click()
        expect(columns(screen.container)[0].dataset.schDay).toBe('2026-09-14')
        await screen.getByRole('button', { name: 'Previous' }).click()
        await screen.getByRole('button', { name: 'Previous' }).click()
        expect(columns(screen.container)[0].dataset.schDay).toBe('2026-08-31')
        await screen.getByRole('button', { name: 'Today' }).click()
        const today = new Date().toISOString().slice(0, 10)
        expect(columns(screen.container).map((c) => c.dataset.schDay)).toContain(today)
    })

    it('switches views from the toolbar', async () => {
        const screen = render(Scheduler, { timeZone: ZONE, date: anchor })
        await screen.getByRole('radio', { name: 'Day' }).click()
        expect(columns(screen.container)).toHaveLength(1)
        expect(
            screen.container.querySelector('[data-sch-view]')?.getAttribute('data-sch-view')
        ).toBe('day')
    })

    it('marks today in the header and draws the now line', () => {
        const { container } = render(Scheduler, { timeZone: ZONE })
        expect(container.querySelector('[aria-current="date"]')).not.toBeNull()
        expect(container.querySelector('[data-sch-now]')).not.toBeNull()
    })

    it('uses the labels of the given locale pack', () => {
        const { container } = render(Scheduler, {
            timeZone: ZONE,
            date: anchor,
            labels: { today: 'Hôm nay', allDay: 'Cả ngày' }
        })
        expect(container.textContent).toContain('Hôm nay')
        expect(container.textContent).toContain('Cả ngày')
    })

    it('renders a custom view registered by name', () => {
        const custom = {
            name: 'two-days',
            layout: 'time-grid',
            range: (a: typeof anchor) => ({
                start: a.set({ hour: 0, minute: 0 }),
                end: a.add({ days: 2 }).set({ hour: 0, minute: 0 })
            }),
            step: (a: typeof anchor, d: 1 | -1) => a.add({ days: 2 * d }),
            component: (() => undefined) as never
        }
        const { container } = render(Scheduler, {
            timeZone: ZONE,
            date: anchor,
            views: [custom],
            view: 'two-days'
        })
        expect(container.querySelector('[data-sch-view]')?.getAttribute('data-sch-view')).toBe(
            'two-days'
        )
    })
})

describe('Scheduler with a bound events array', () => {
    it('shows events pushed into the array', async () => {
        const screen = render(BoundScheduler, { initial: [] })
        expect(chips(screen.container)).toHaveLength(0)
        screen.component.push(input('late', '2026-09-09T09:00', '2026-09-09T10:00'))
        await tick()
        expect(chips(screen.container).map((c) => c.textContent)).toEqual(
            expect.arrayContaining([expect.stringContaining('late')])
        )
    })

    it('writes a committed mutation back into the array and persists it', async () => {
        const onMutate = vi.fn()
        const plugin: InteractionPlugin = {
            name: 'creator',
            attach: (context) => () => {
                context.commit({
                    kind: 'create',
                    eventId: 'new',
                    before: null,
                    after: {
                        id: 'new',
                        title: 'new',
                        start: parseZonedDateTime('2026-09-09T13:00[Asia/Ho_Chi_Minh]'),
                        end: parseZonedDateTime('2026-09-09T14:00[Asia/Ho_Chi_Minh]')
                    }
                })
            }
        }
        const screen = render(BoundScheduler, { initial: [], interactions: [plugin], onMutate })
        await tick()
        expect(onMutate).toHaveBeenCalledWith(
            expect.objectContaining({ kind: 'create', eventId: 'new' })
        )
        expect(screen.component.getEvents().map((e) => e.id)).toEqual(['new'])
        expect(chips(screen.container)).toHaveLength(1)
    })

    it('attaches interactions once, not again on every store change', async () => {
        const attached = vi.fn()
        const plugin: InteractionPlugin = { name: 'counter', attach: () => attached }
        const screen = render(BoundScheduler, { initial: [], interactions: [plugin] })
        await tick()
        screen.component.push(input('one', '2026-09-09T09:00', '2026-09-09T10:00'))
        await tick()
        screen.component.push(input('two', '2026-09-09T11:00', '2026-09-09T12:00'))
        await tick()
        expect(chips(screen.container)).toHaveLength(2)
        expect(attached).toHaveBeenCalledTimes(1)
    })

    it('rolls a failed mutation back out of the array', async () => {
        const plugin: InteractionPlugin = {
            name: 'creator',
            attach: (context) => () => {
                context.commit({
                    kind: 'create',
                    eventId: 'new',
                    before: null,
                    after: {
                        id: 'new',
                        title: 'new',
                        start: parseZonedDateTime('2026-09-09T13:00[Asia/Ho_Chi_Minh]'),
                        end: parseZonedDateTime('2026-09-09T14:00[Asia/Ho_Chi_Minh]')
                    }
                })
            }
        }
        const screen = render(BoundScheduler, {
            initial: [input('kept', '2026-09-09T09:00', '2026-09-09T10:00')],
            interactions: [plugin],
            onMutate: () => Promise.reject(new Error('offline'))
        })
        await tick()
        await tick()
        expect(screen.component.getEvents().map((e) => e.id)).toEqual(['kept'])
        expect(chips(screen.container)).toHaveLength(1)
    })
})

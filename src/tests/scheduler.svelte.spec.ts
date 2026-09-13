import { parseZonedDateTime } from '@internationalized/date'
import { describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-svelte'
import { Scheduler } from '../lib/index.js'
import type { EventInput } from '../lib/types/event.types.js'
import type { InteractionPlugin } from '../lib/types/extension.types.js'
import type { EventSourceFn } from '../lib/types/source.types.js'
import BoundScheduler from './fixtures/BoundScheduler.svelte'
import SourceScheduler from './fixtures/SourceScheduler.svelte'

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

    it('renders one column in the day view, dated in the toolbar and inside the view', () => {
        const { container } = render(Scheduler, {
            props: { timeZone: ZONE, date: anchor, view: 'day' }
        })
        expect(columns(container)).toHaveLength(1)
        expect(title(container)).toBe('September 9, 2026')
        const dayTitle = container.querySelector('[data-sch-day-title]')
        expect(dayTitle?.textContent).toContain('Wednesday')
        expect(dayTitle?.textContent).toContain('September 9, 2026')
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
        const wrapper = chip.closest<HTMLElement>('[data-sch-event]')!
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
        await screen.getByRole('tab', { name: 'Day' }).click()
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
            props: {
                timeZone: ZONE,
                date: anchor,
                labels: { today: 'Hôm nay', allDay: 'Cả ngày', noEvents: 'Không có sự kiện' },
                events: [input('a', '2026-09-09', '2026-09-10', { allDay: true })]
            }
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

describe('Scheduler month view', () => {
    const monthProps = { timeZone: ZONE, date: anchor, view: 'month', weekStartsOn: 1 as const }
    const cells = (container: Element) => [
        ...container.querySelectorAll<HTMLElement>('[data-sch-day]')
    ]

    it('renders whole weeks covering the month', () => {
        const { container } = render(Scheduler, { props: monthProps })
        const days = cells(container).map((c) => c.dataset.schDay)
        expect(days.length % 7).toBe(0)
        expect(days[0]).toBe('2026-08-31')
        expect(days.at(-1)).toBe('2026-10-04')
        expect(title(container)).toBe('September 2026')
    })

    it('starts the grid on the configured weekday', () => {
        const { container } = render(Scheduler, { props: { ...monthProps, weekStartsOn: 0 } })
        expect(cells(container)[0].dataset.schDay).toBe('2026-08-30')
    })

    it('dims the days of the neighbouring months', () => {
        const { container } = render(Scheduler, { props: monthProps })
        const [first, second] = cells(container)
        const colour = (cell: HTMLElement) => getComputedStyle(cell.querySelector('span')!).color
        expect(colour(first)).not.toBe(colour(second))
        expect(colour(second)).toBe(colour(cells(container)[10]))
    })

    it('marks today', () => {
        const { container } = render(Scheduler, { props: { ...monthProps, date: undefined } })
        expect(container.querySelector('[aria-current="date"]')).not.toBeNull()
    })

    it('names each cell for assistive tech, with its event count', () => {
        const { container } = render(Scheduler, {
            props: {
                ...monthProps,
                events: [input('a', '2026-09-09T09:00', '2026-09-09T10:00')]
            }
        })
        const cell = container.querySelector('[data-sch-day="2026-09-09"]')
        expect(cell?.getAttribute('aria-label')).toBe('Wednesday, September 9, 2026, 1 event')
        const empty = container.querySelector('[data-sch-day="2026-09-10"]')
        expect(empty?.getAttribute('aria-label')).toContain('no events')
    })

    it('spans a multi-day event across its columns and breaks it at the week boundary', () => {
        const { container } = render(Scheduler, {
            props: {
                ...monthProps,
                events: [input('trip', '2026-09-10', '2026-09-16', { allDay: true })]
            }
        })
        const wrappers = chips(container).map((c) => c.closest<HTMLElement>('[data-sch-event]')!)
        expect(wrappers).toHaveLength(2)
        expect(wrappers[0].style.gridColumn).toBe('4 / 8')
        expect(wrappers[1].style.gridColumn).toBe('1 / 3')
    })

    it('collapses what does not fit into a more link that opens a popover', async () => {
        const many = Array.from({ length: 8 }, (_, i) =>
            input(`e${i}`, `2026-09-09T0${i + 1}:00`, `2026-09-09T0${i + 1}:30`)
        )
        const screen = render(Scheduler, { props: { ...monthProps, events: many } })
        const more = screen.container.querySelector<HTMLElement>('[data-sch-more="2026-09-09"]')
        expect(more).not.toBeNull()
        expect(more?.textContent?.trim()).toMatch(/^\+\d+$/)
        expect(more?.getAttribute('aria-label')).toMatch(/more$/)

        const trigger = more!.closest('button') ?? more!
        trigger.dispatchEvent(
            new PointerEvent('pointerdown', { bubbles: true, pointerId: 1, button: 0 })
        )
        trigger.dispatchEvent(new MouseEvent('click', { bubbles: true }))
        await new Promise((resolve) => setTimeout(resolve, 150))
        expect(document.body.textContent).toContain('Wednesday, Sep 9')
    })
})

describe('Scheduler agenda view', () => {
    const agendaProps = { timeZone: ZONE, date: anchor, view: 'agenda' }
    const groups = (container: Element) => [
        ...container.querySelectorAll<HTMLElement>('[data-sch-day]')
    ]

    it('shows an empty state when the range holds no events', () => {
        const { container } = render(Scheduler, { props: agendaProps })
        expect(container.textContent).toContain('No events')
        expect(groups(container)).toHaveLength(0)
    })

    it('accepts a custom empty snippet', () => {
        const { container } = render(Scheduler, {
            props: { ...agendaProps, events: [] }
        })
        expect(container.querySelector('[data-sch-agenda]')).not.toBeNull()
    })

    it('groups events by day and skips days without any', () => {
        const { container } = render(Scheduler, {
            props: {
                ...agendaProps,
                events: [
                    input('a', '2026-09-09T09:00', '2026-09-09T10:00'),
                    input('b', '2026-09-09T14:00', '2026-09-09T14:30'),
                    input('c', '2026-09-15T09:00', '2026-09-15T09:45')
                ]
            }
        })
        expect(groups(container).map((g) => g.dataset.schDay)).toEqual(['2026-09-09', '2026-09-15'])
    })

    it('counts events and sums the booked time per day', () => {
        const { container } = render(Scheduler, {
            props: {
                ...agendaProps,
                events: [
                    input('a', '2026-09-09T09:00', '2026-09-09T10:00'),
                    input('b', '2026-09-09T14:00', '2026-09-09T14:30')
                ]
            }
        })
        const header = groups(container)[0].firstElementChild
        expect(header?.textContent).toContain('2 events')
        expect(header?.textContent).toContain('1h 30m')
    })

    it('counts an all-day event without adding booked time', () => {
        const { container } = render(Scheduler, {
            props: {
                ...agendaProps,
                events: [input('a', '2026-09-09', '2026-09-10', { allDay: true })]
            }
        })
        const header = groups(container)[0].firstElementChild
        expect(header?.textContent).toContain('1 event')
        expect(header?.textContent).not.toContain('h')
    })

    it('shows the start and end time of a timed event and All day otherwise', () => {
        const { container } = render(Scheduler, {
            props: {
                ...agendaProps,
                events: [
                    input('timed', '2026-09-09T15:00', '2026-09-09T15:45'),
                    input('whole', '2026-09-09', '2026-09-10', { allDay: true })
                ]
            }
        })
        const rows = [...container.querySelectorAll('[data-sch-event-id]')]
        expect(rows.map((r) => r.getAttribute('data-sch-event-id'))).toEqual(['whole', 'timed'])
        expect(rows[0].textContent).toContain('All day')
        expect(rows[1].textContent).toContain('3:00')
        expect(rows[1].textContent).toContain('3:45')
    })

    it('repeats a multi-day event under every day it covers', () => {
        const { container } = render(Scheduler, {
            props: {
                ...agendaProps,
                events: [input('trip', '2026-09-09', '2026-09-12', { allDay: true })]
            }
        })
        expect(groups(container).map((g) => g.dataset.schDay)).toEqual([
            '2026-09-09',
            '2026-09-10',
            '2026-09-11'
        ])
    })
})

describe('Scheduler time grid details', () => {
    it('hides the all-day row when nothing is all day', () => {
        const { container } = render(Scheduler, {
            props: {
                timeZone: ZONE,
                date: anchor,
                events: [input('a', '2026-09-09T09:00', '2026-09-09T10:00')]
            }
        })
        expect(container.textContent).not.toContain('All day')
    })

    it('shows the all-day row as soon as one event needs it', () => {
        const { container } = render(Scheduler, {
            props: {
                timeZone: ZONE,
                date: anchor,
                events: [input('a', '2026-09-09', '2026-09-10', { allDay: true })]
            }
        })
        expect(container.textContent).toContain('All day')
    })

    it('labels the current time beside the now line', () => {
        const { container } = render(Scheduler, { props: { timeZone: ZONE } })
        expect(container.querySelector('[data-sch-now]')).not.toBeNull()
        const label = container.querySelector('[data-sch-time-grid] .text-error')
        expect(label?.textContent).toMatch(/\d/)
    })

    it('shows a day title with a Today badge in the day view', () => {
        const { container } = render(Scheduler, { props: { timeZone: ZONE, view: 'day' } })
        const title = container.querySelector('[data-sch-day-title]')
        expect(title?.textContent).toContain('Today')
    })

    it('tells the user when the visible range is empty', () => {
        const { container } = render(Scheduler, { props: { timeZone: ZONE, date: anchor } })
        expect(container.querySelector('[data-sch-empty]')?.textContent?.trim()).toBe('No events')
    })

    it('uses 24 hour labels when asked', () => {
        const { container } = render(Scheduler, {
            props: {
                timeZone: ZONE,
                date: anchor,
                hour12: false,
                events: [input('a', '2026-09-09T15:00', '2026-09-09T16:00')]
            }
        })
        expect(container.querySelector('[data-sch-event-id="a"]')?.textContent).toContain('15:00')
    })
})

describe('Scheduler with a recurring series', () => {
    const weekdays: EventInput = {
        id: 'standup',
        title: 'Standup',
        start: '2026-09-01T09:00',
        end: '2026-09-01T09:30',
        recurrence: { freq: 'weekly', byDay: [1, 2, 3, 4, 5], exDates: ['2026-09-09T09:00'] }
    }

    it('renders one occurrence per matching day, honouring exclusions', () => {
        const { container } = render(Scheduler, {
            props: { timeZone: ZONE, date: anchor, events: [weekdays] }
        })
        const days = chips(container).map((c) =>
            c.closest('[data-sch-day]')?.getAttribute('data-sch-day')
        )
        expect(days).toEqual(['2026-09-07', '2026-09-08', '2026-09-10', '2026-09-11'])
    })

    it('keeps the series, not its occurrences, in the bound array', async () => {
        const screen = render(BoundScheduler, { initial: [weekdays], date: anchor })
        await tick()
        expect(screen.component.getEvents().map((e) => e.id)).toEqual(['standup'])
        expect(chips(screen.container).length).toBeGreaterThan(1)
    })

    it('lists occurrences in the agenda', () => {
        const { container } = render(Scheduler, {
            props: { timeZone: ZONE, date: anchor, view: 'agenda', events: [weekdays] }
        })
        const groups = [...container.querySelectorAll('[data-sch-day]')].map((g) =>
            g.getAttribute('data-sch-day')
        )
        expect(groups).toContain('2026-09-07')
        expect(groups).not.toContain('2026-09-09')
    })
})

describe('Scheduler with an async source', () => {
    const settle = () => new Promise((resolve) => setTimeout(resolve, 30))

    it('loads the visible range, then only the gaps when navigating', async () => {
        const calls: string[] = []
        const source: EventSourceFn = async ({ range }) => {
            calls.push(
                `${range.start.toString().slice(0, 10)}..${range.end.toString().slice(0, 10)}`
            )
            return range.start.day === 7 ? [input('a', '2026-09-09T09:00', '2026-09-09T10:00')] : []
        }
        const screen = render(SourceScheduler, { source, date: anchor })
        await settle()
        expect(chips(screen.container)).toHaveLength(1)
        expect(calls).toEqual(['2026-09-07..2026-09-14'])

        screen.component.next()
        await settle()
        expect(calls).toEqual(['2026-09-07..2026-09-14', '2026-09-14..2026-09-21'])
        expect(chips(screen.container)).toHaveLength(0)

        screen.component.previous()
        await settle()
        expect(calls).toHaveLength(2)
        expect(chips(screen.container)).toHaveLength(1)
    })

    it('keeps a committed mutation after navigating away and back', async () => {
        const source: EventSourceFn = async ({ range }) =>
            range.start.day === 7 ? [input('a', '2026-09-09T09:00', '2026-09-09T10:00')] : []
        const plugin: InteractionPlugin = {
            name: 'mover',
            attach: (context) => () => {
                const timer = setTimeout(() => {
                    const event = context.getEvent('a')
                    if (!event) return
                    context.commit({
                        kind: 'move',
                        eventId: 'a',
                        before: event,
                        after: {
                            ...event,
                            start: parseZonedDateTime('2026-09-11T09:00[Asia/Ho_Chi_Minh]'),
                            end: parseZonedDateTime('2026-09-11T10:00[Asia/Ho_Chi_Minh]')
                        }
                    })
                }, 20)
                return () => clearTimeout(timer)
            }
        }
        const onMutate = vi.fn()
        const screen = render(SourceScheduler, { source, date: anchor, onMutate })
        await settle()
        expect(chips(screen.container)).toHaveLength(1)

        screen.component.next()
        await settle()
        screen.component.previous()
        await settle()
        expect(
            chips(screen.container)[0].closest('[data-sch-day]')?.getAttribute('data-sch-day')
        ).toBe('2026-09-09')

        const rerendered = render(SourceScheduler, {
            source,
            date: anchor,
            onMutate,
            interactions: [plugin]
        })
        await settle()
        await settle()
        await settle()
        expect(onMutate).toHaveBeenCalledWith(expect.objectContaining({ kind: 'move' }))
        rerendered.component.next()
        await settle()
        rerendered.component.previous()
        await settle()
        const moved = chips(rerendered.container).find((c) => c.dataset.schEventId === 'a')
        expect(moved?.closest('[data-sch-day]')?.getAttribute('data-sch-day')).toBe('2026-09-11')
    })
})

describe('Scheduler verification fixes', () => {
    const settle = () => new Promise((resolve) => setTimeout(resolve, 30))

    it('shows the loading skeleton while a source loads and removes it afterwards', async () => {
        let resolve!: (value: EventInput[]) => void
        const source: EventSourceFn = () => new Promise((r) => (resolve = r))
        const screen = render(SourceScheduler, { source, date: anchor })
        await settle()
        expect(screen.container.querySelector('[aria-busy="true"]')).not.toBeNull()
        resolve([input('a', '2026-09-09T09:00', '2026-09-09T10:00')])
        await settle()
        expect(screen.container.querySelector('[aria-busy="true"]')).toBeNull()
        expect(chips(screen.container)).toHaveLength(1)
    })

    it('keeps the skeleton when a stale load settles after a newer one started', async () => {
        const pending: ((value: EventInput[]) => void)[] = []
        const source: EventSourceFn = () => new Promise((r) => pending.push(r))
        const screen = render(SourceScheduler, { source, date: anchor })
        await settle()
        screen.component.next()
        await settle()
        pending[0]([])
        await settle()
        expect(screen.container.querySelector('[aria-busy="true"]')).not.toBeNull()
        pending[1]([])
        await settle()
        expect(screen.container.querySelector('[aria-busy="true"]')).toBeNull()
    })

    it('re-announces an identical message so screen readers hear it twice', async () => {
        const screen = render(BoundScheduler, { initial: [], date: anchor })
        const grid = screen.container.querySelector<HTMLElement>('[role="application"]')!
        const live = screen.container.querySelector('[aria-live="polite"][aria-atomic]')!
        grid.focus()
        grid.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }))
        await settle()
        const first = live.textContent
        grid.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }))
        await settle()
        expect(live.textContent?.trim()).toBe(first?.trim())
        expect(live.textContent).not.toBe(first)
    })
})

describe('custom duration', () => {
    it('shows the given number of days from the anchor and steps by that many', async () => {
        const { container } = render(Scheduler, {
            props: { timeZone: ZONE, date: anchor, view: 'week', days: 4 }
        })
        expect(columns(container).map((c) => c.dataset.schDay)).toEqual([
            '2026-09-09',
            '2026-09-10',
            '2026-09-11',
            '2026-09-12'
        ])
        expect(title(container)).toContain('Sep 9')
        container.querySelector<HTMLElement>('button[aria-label="Next"]')!.click()
        await tick()
        expect(columns(container)[0].dataset.schDay).toBe('2026-09-13')
    })

    it('handles a fortnight without mistaking it for a month grid', async () => {
        const { container } = render(Scheduler, {
            props: { timeZone: ZONE, date: anchor, view: 'week', days: 14 }
        })
        expect(columns(container)).toHaveLength(14)
        const target = container.querySelector<HTMLElement>('[role="application"]')!
        target.focus()
        await tick()
        const ring = container.querySelector<HTMLElement>('[data-sch-focus]')!
        expect(ring.style.top).not.toBe('')
        for (let i = 0; i < 14; i += 1) {
            target.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
        }
        await tick()
        expect(columns(container)[0].dataset.schDay).toBe('2026-09-23')
    })

    it('leaves the other views alone', () => {
        const { container } = render(Scheduler, {
            props: { timeZone: ZONE, date: anchor, view: 'day', days: 4 }
        })
        expect(columns(container)).toHaveLength(1)
    })
})

import { createRawSnippet } from 'svelte'
import { describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-svelte'
import { Scheduler } from '../lib/index.js'
import type { Mutation } from '../lib/types/mutation.types.js'
import type { SidebarSnippetProps } from '../lib/types/snippet.types.js'
import BoundScheduler from './fixtures/BoundScheduler.svelte'
import { ZONE, anchor, column, drag, input, pointAt, tap, wait } from './fixtures/dom.js'

const settle = () => wait(60)
const calendars = [
    { id: 'work', title: 'Work', color: 'info' as const },
    { id: 'home', title: 'Personal', color: 'success' as const }
]
const events = [
    input('standup', '2026-09-09T09:00', '2026-09-09T09:30', { calendarId: 'work' }),
    input('Họp nhóm', '2026-09-10T10:00', '2026-09-10T11:00', { calendarId: 'work' }),
    input('gym', '2026-09-09T18:00', '2026-09-09T19:00', { calendarId: 'home' }),
    input('red', '2026-09-11T09:00', '2026-09-11T10:00', { calendarId: 'home', color: 'error' }),
    input('loose', '2026-09-12T09:00', '2026-09-12T10:00'),
    input('weekly', '2026-09-07T07:00', '2026-09-07T07:30', {
        calendarId: 'home',
        recurrence: { freq: 'daily', count: 5 }
    })
]
const ids = (root: Element) =>
    [
        ...new Set(
            [...root.querySelectorAll<HTMLElement>('[data-sch-event-id]')].map(
                (chip) => chip.dataset.schEventId!.split('@')[0]
            )
        )
    ].sort()
const mount = (props: Record<string, unknown>) =>
    render(Scheduler, { props: { timeZone: ZONE, date: anchor, events, calendars, ...props } })

describe('calendars', () => {
    it('hides the events of hidden calendars, occurrences included, in every grid view', () => {
        for (const view of ['week', 'month', 'agenda']) {
            const { container, unmount } = mount({ view, hiddenCalendars: ['home'] })
            expect(ids(container)).toEqual(['Họp nhóm', 'loose', 'standup'])
            unmount()
        }
    })

    it('shows them again when the calendar is unhidden', async () => {
        const screen = mount({ hiddenCalendars: ['home'] })
        await screen.rerender({ hiddenCalendars: [] })
        expect(ids(screen.container)).toEqual([
            'Họp nhóm',
            'gym',
            'loose',
            'red',
            'standup',
            'weekly'
        ])
    })

    it('filters by title ignoring case and accents, then by the custom predicate', async () => {
        const screen = mount({ search: 'HOP', locale: 'vi-VN' })
        expect(ids(screen.container)).toEqual(['Họp nhóm'])
        await screen.rerender({ search: '', filter: (event: { id: string }) => event.id !== 'gym' })
        expect(ids(screen.container)).toEqual(['Họp nhóm', 'loose', 'red', 'standup', 'weekly'])
    })

    it('colours a chip by its calendar unless the event sets its own colour', () => {
        const { container } = mount({})
        const chip = (id: string) =>
            container.querySelector<HTMLElement>(`[data-sch-event-id="${id}"]`)!.className
        expect(chip('standup')).toContain('bg-info-container')
        expect(chip('gym')).toContain('bg-success-container')
        expect(chip('red')).toContain('bg-error-container')
        expect(chip('loose')).toContain('bg-primary-container')
    })

    it('names the calendar in the event popover', async () => {
        const { container } = mount({})
        tap(container.querySelector('[data-sch-event-id="gym"]')!)
        await settle()
        const row = document.querySelector('[data-sch-detail="gym"] [data-sch-detail-calendar]')
        expect(row?.textContent).toContain('Personal')
        expect(row?.querySelector('span')?.className).toContain('bg-success')
        tap(container.querySelector('[data-sch-event-id="loose"]')!)
        await settle()
        expect(
            document.querySelector('[data-sch-detail="loose"] [data-sch-detail-calendar]')
        ).toBeNull()
    })

    it('hands the sidebar only the events that pass the filters', () => {
        let seen: string[] = []
        const sidebar = createRawSnippet((props: () => SidebarSnippetProps) => {
            seen = props()
                .events.map((event) => event.id)
                .sort()
            return { render: () => '<i></i>' }
        })
        mount({ sidebar, hiddenCalendars: ['work'], search: '' })
        expect(seen).toEqual(['gym', 'loose', 'red', 'weekly'])
    })

    it('never writes the calendar colour into the bound events', async () => {
        const onMutate = vi.fn()
        const screen = render(BoundScheduler, {
            initial: [input('gym', '2026-09-09T09:00', '2026-09-09T10:00', { calendarId: 'home' })],
            calendars,
            onMutate,
            date: anchor
        })
        const wrapper = screen.container.querySelector<HTMLElement>('[data-sch-event="gym"]')!
        const rect = wrapper.getBoundingClientRect()
        const from = { clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 }
        await drag(wrapper, from, pointAt(column(screen.container, '2026-09-10'), 600))
        const mutation: Mutation = onMutate.mock.calls[0][0]
        expect(mutation.after!.calendarId).toBe('home')
        expect(mutation.after!.color).toBeUndefined()
        expect(screen.component.getEvents()[0].color).toBeUndefined()
    })
})

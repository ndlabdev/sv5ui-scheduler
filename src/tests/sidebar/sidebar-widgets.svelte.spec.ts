import axe from 'axe-core'
import { describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { render } from 'vitest-browser-svelte'
import type { Mutation } from '../../lib/types/mutation.types.js'
import SidebarWidgets from '../fixtures/SidebarWidgets.svelte'
import {
    anchor,
    centre,
    column,
    frame,
    input,
    iso,
    pointAt,
    pointer,
    wait
} from '../fixtures/dom.js'

const settle = () => wait(60)
const calendars = [
    { id: 'work', title: 'Work', color: 'info' as const },
    { id: 'home', title: 'Personal', color: 'success' as const }
]
const events = [
    input('standup', '2026-09-09T09:00', '2026-09-09T09:30', { calendarId: 'work' }),
    input('Họp nhóm', '2026-09-10T10:00', '2026-09-10T11:00', { calendarId: 'work' }),
    input('gym', '2026-09-09T18:00', '2026-09-09T19:00', { calendarId: 'home' })
]
const items = [
    { title: 'Dentist', durationMinutes: 90, calendarId: 'home', data: { source: 'backlog' } },
    { title: 'Call the bank', color: 'error' as const }
]
const shown = (root: Element) =>
    [...root.querySelectorAll<HTMLElement>('[data-sch-event-id]')]
        .map((chip) => chip.dataset.schEventId)
        .sort()
const mount = (onMutate = vi.fn()) =>
    render(SidebarWidgets, { props: { initial: events, calendars, items, date: anchor, onMutate } })

describe('CalendarList with the scheduler', () => {
    it('hides and shows a calendar from its checkbox', async () => {
        const screen = mount()
        const work = screen.getByRole('checkbox', { name: 'Work' })
        await expect.element(work).toBeChecked()
        await work.click()
        await settle()
        expect(screen.component.getHidden()).toEqual(['work'])
        expect(shown(screen.container)).toEqual(['gym'])
        await expect.element(work).not.toBeChecked()
        const name = screen.container.querySelector('[data-sch-calendar="work"] span:last-child')!
        expect(name.className).toContain('text-on-surface-variant')

        await work.click()
        await settle()
        expect(shown(screen.container)).toEqual(['Họp nhóm', 'gym', 'standup'])
    })
})

describe('SearchBox with the scheduler', () => {
    it('filters events as the user types', async () => {
        const screen = mount()
        await userEvent.fill(screen.getByRole('textbox', { name: 'Search events' }), 'hop')
        await settle()
        expect(screen.component.getSearch()).toBe('hop')
        expect(shown(screen.container)).toEqual(['Họp nhóm'])
    })

    it('focuses from the slash key but leaves other text fields alone', async () => {
        const screen = mount()
        const field = screen.container.querySelector<HTMLInputElement>(
            '[data-sch-search-box] input, input[data-sch-search-box]'
        )!
        ;(document.activeElement as HTMLElement | null)?.blur()
        await userEvent.keyboard('/')
        expect(document.activeElement).toBe(field)
        expect(field.value).toBe('')

        const other = screen.container.querySelector<HTMLInputElement>('[data-other]')!
        other.focus()
        await userEvent.keyboard('/')
        expect(document.activeElement).toBe(other)
        expect(other.value).toBe('/')
    })
})

describe('DragSourceList with the scheduler', () => {
    it('shows each item with its colour and duration', () => {
        const { container } = mount()
        const rows = [
            ...container.querySelectorAll<HTMLElement>('[data-sch-drag-source-list] button')
        ]
        expect(rows.map((row) => row.textContent?.replace(/\s+/g, ' ').trim())).toEqual([
            'Dentist 1h 30m',
            'Call the bank'
        ])
        expect(rows[0].querySelector('span')!.className).toContain('bg-success')
        expect(rows[1].querySelector('span')!.className).toContain('bg-error')
    })

    it('creates an event with the item data where it is dropped', async () => {
        const onMutate = vi.fn()
        const screen = mount(onMutate)
        const handle = screen.container.querySelector<HTMLElement>(
            '[data-sch-drag-source-list] button'
        )!
        const day = column(screen.container, '2026-09-10')
        day.closest<HTMLElement>('[data-scroll-area-viewport]')!.scrollTop = 0
        const target = pointAt(day, 480)
        handle.dispatchEvent(pointer('pointerdown', centre(handle)))
        expect(handle.dataset.schDragging).toBe('')
        handle.dispatchEvent(pointer('pointermove', target))
        await frame()
        handle.dispatchEvent(pointer('pointerup', target))
        await settle()
        const mutation: Mutation = onMutate.mock.calls[0][0]
        expect(mutation.kind).toBe('create')
        expect(iso(mutation.after!.start)).toBe('2026-09-10T08:00')
        expect(iso(mutation.after!.end)).toBe('2026-09-10T09:30')
        expect(mutation.after!.calendarId).toBe('home')
        expect(mutation.after!.data).toEqual({ source: 'backlog' })
    })
})

describe('sidebar widgets accessibility', () => {
    it('has no axe violations', async () => {
        const { container } = mount()
        await settle()
        const result = await axe.run(container, {
            resultTypes: ['violations'],
            rules: { region: { enabled: false } }
        })
        expect(result.violations.map((violation) => violation.id)).toEqual([])
    })
})

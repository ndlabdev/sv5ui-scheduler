import { describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-svelte'
import { Scheduler } from '../../lib/index.js'
import type { SchedulerEvent, SlotSelection } from '../../lib/types/index.js'
import type { Mutation } from '../../lib/types/mutation.types.js'
import {
    ZONE,
    anchor,
    centre,
    column,
    drag,
    grid,
    input,
    iso,
    pointAt,
    pointer,
    press,
    settle,
    tap,
    wait,
    type Point
} from '../fixtures/dom.js'

const events = [
    input('a', '2026-09-09T09:00', '2026-09-09T10:00'),
    input('standup', '2026-09-07T08:00', '2026-09-07T08:30', {
        recurrence: { freq: 'daily', count: 5 }
    })
]

function mount(props: Record<string, unknown>) {
    const onMutate = vi.fn()
    const onEventClick = vi.fn()
    const onSelectSlot = vi.fn()
    const screen = render(Scheduler, {
        props: {
            timeZone: ZONE,
            date: anchor,
            events,
            onMutate,
            onEventClick,
            onSelectSlot,
            ...props
        }
    })
    screen.container.style.height = '1400px'
    return { ...screen, onMutate, onEventClick, onSelectSlot }
}

function tapAt(target: Element, at: Point) {
    target.dispatchEvent(pointer('pointerdown', at))
    target.dispatchEvent(pointer('pointerup', at))
    target.dispatchEvent(new MouseEvent('click', { ...at, bubbles: true }))
}

const chip = (container: Element, id: string) =>
    container.querySelector<HTMLElement>(`[data-sch-event-id="${id}"]`)!

describe('onEventClick', () => {
    it('reports the clicked event alongside the popover', async () => {
        const { container, onEventClick } = mount({})
        await wait(60)
        tap(chip(container, 'a'))
        await settle()
        expect(onEventClick).toHaveBeenCalledTimes(1)
        const clicked: SchedulerEvent = onEventClick.mock.calls[0][0]
        expect(clicked.id).toBe('a')
        expect(clicked.title).toBe('a')
        expect(document.querySelector('[data-sch-detail="a"]')).not.toBeNull()
    })

    it('reports the clicked event when the popover is off', async () => {
        const { container, onEventClick } = mount({ detail: false })
        await wait(60)
        tap(chip(container, 'a'))
        await settle()
        expect(onEventClick).toHaveBeenCalledTimes(1)
        expect(document.querySelector('[data-sch-detail="a"]')).toBeNull()
    })

    it('hands over an occurrence with its series id', async () => {
        const { container, onEventClick } = mount({ detail: false })
        await wait(60)
        const occurrence = [
            ...container.querySelectorAll<HTMLElement>('[data-sch-event^="standup@"]')
        ].find((element) => element.dataset.schEvent?.includes('2026-09-09'))!
        tap(occurrence.querySelector('[data-sch-event-id]') ?? occurrence)
        await settle()
        const clicked: SchedulerEvent = onEventClick.mock.calls[0][0]
        expect(clicked.seriesId).toBe('standup')
        expect(iso(clicked.start)).toBe('2026-09-09T08:00')
    })

    it('fires from the keyboard on a focused chip', async () => {
        const { container, onEventClick } = mount({ detail: false })
        await wait(60)
        const target = chip(container, 'a')
        target.focus()
        target.click()
        await settle()
        expect(onEventClick).toHaveBeenCalledTimes(1)
    })
})

describe('onSelectSlot', () => {
    it('reports a clicked time slot snapped to the grid', async () => {
        const { container, onSelectSlot, onMutate } = mount({ creatable: false })
        await wait(60)
        tapAt(grid(container), pointAt(column(container, '2026-09-10'), 550))
        await settle()
        expect(onSelectSlot).toHaveBeenCalledTimes(1)
        const selection: SlotSelection = onSelectSlot.mock.calls[0][0]
        expect(iso(selection.start)).toBe('2026-09-10T09:00')
        expect(iso(selection.end)).toBe('2026-09-10T09:30')
        expect(selection.allDay).toBe(false)
        expect(onMutate).not.toHaveBeenCalled()
    })

    it('reports a whole day from a month cell', async () => {
        const { container, onSelectSlot } = mount({ creatable: false, view: 'month' })
        await wait(60)
        tap(container.querySelector('[data-sch-day="2026-09-22"]')!)
        await settle()
        const selection: SlotSelection = onSelectSlot.mock.calls[0][0]
        expect(iso(selection.start)).toBe('2026-09-22T00:00')
        expect(iso(selection.end)).toBe('2026-09-23T00:00')
        expect(selection.allDay).toBe(true)
    })

    it('reports the focused slot on Enter when creation is off', async () => {
        const { container, onSelectSlot, onMutate } = mount({ creatable: false })
        const target = grid(container)
        target.focus()
        await settle()
        press(target, 'Enter')
        await settle()
        expect(onMutate).not.toHaveBeenCalled()
        const selection: SlotSelection = onSelectSlot.mock.calls[0][0]
        expect(iso(selection.start)).toBe('2026-09-13T09:00')
        expect(iso(selection.end)).toBe('2026-09-13T09:30')
    })

    it('still fires on click while creation stays on, and Enter creates instead', async () => {
        const { container, onSelectSlot, onMutate } = mount({})
        await wait(60)
        tapAt(grid(container), pointAt(column(container, '2026-09-10'), 550))
        await settle()
        expect(onSelectSlot).toHaveBeenCalledTimes(1)
        expect(onMutate).not.toHaveBeenCalled()
        const target = grid(container)
        target.focus()
        await settle()
        press(target, 'Enter')
        await settle()
        expect(onMutate).toHaveBeenCalledTimes(1)
        expect(onSelectSlot).toHaveBeenCalledTimes(1)
    })

    it('does not fire from a click on an event', async () => {
        const { container, onSelectSlot } = mount({ creatable: false })
        await wait(60)
        tap(chip(container, 'a'))
        await settle()
        expect(onSelectSlot).not.toHaveBeenCalled()
    })
})

describe('editable', () => {
    it('locks moving, resizing and deleting when false', async () => {
        const { container, onMutate } = mount({ editable: false })
        await wait(60)
        const wrapper = container.querySelector<HTMLElement>('[data-sch-event="a"]')!
        expect(wrapper.className).not.toContain('cursor-grab')
        const from = centre(wrapper)
        await drag(wrapper, from, { clientX: from.clientX, clientY: from.clientY + 96 })
        expect(container.querySelector('[data-sch-ghost]')).toBeNull()
        expect(onMutate).not.toHaveBeenCalled()

        tap(chip(container, 'a'))
        await settle()
        const detail = document.querySelector<HTMLElement>('[data-sch-detail="a"]')!
        expect(detail.querySelector('button[aria-label="Delete event"]')).toBeNull()

        press(grid(container), 'Escape')
        const target = grid(container)
        target.focus()
        tap(chip(container, 'a'))
        await settle()
        press(target, 'Delete')
        await settle()
        expect(onMutate).not.toHaveBeenCalled()
    })

    it('still creates by drag and drops from outside when only editing is locked', async () => {
        const { container, onMutate } = mount({ editable: false })
        const thu = column(container, '2026-09-10')
        await drag(grid(container), pointAt(thu, 780), pointAt(thu, 840))
        expect(onMutate).toHaveBeenCalledTimes(1)
        const mutation: Mutation = onMutate.mock.calls[0][0]
        expect(mutation.kind).toBe('create')
    })
})

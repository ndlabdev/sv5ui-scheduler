import { parseZonedDateTime } from '@internationalized/date'
import { describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-svelte'
import type { Mutation } from '../../lib/types/mutation.types.js'
import CreatePanelScheduler from '../fixtures/CreatePanelScheduler.svelte'
import {
    ZONE,
    anchor,
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

const open = () => wait(300)
const dialog = () => document.querySelector<HTMLElement>('[role="dialog"]')
const panel = () => document.querySelector<HTMLElement>('[data-sch-create-panel]')
const range = () => panel()?.querySelector('[data-probe-range]')?.textContent
const chips = (root: Element) =>
    [...root.querySelectorAll<HTMLElement>('[data-sch-event]')].map((chip) => chip.dataset.schEvent)

function tapAt(target: Element, at: Point) {
    target.dispatchEvent(pointer('pointerdown', at))
    target.dispatchEvent(pointer('pointerup', at))
    target.dispatchEvent(new MouseEvent('click', { ...at, bubbles: true }))
}

describe('createPanel', () => {
    it('reports a click without opening, opens from a drag and creates through the pipeline', async () => {
        const onMutate = vi.fn()
        const onSelectSlot = vi.fn()
        const screen = render(CreatePanelScheduler, { date: anchor, onMutate, onSelectSlot })
        await settle()
        tapAt(grid(screen.container), pointAt(column(screen.container, '2026-09-10'), 550))
        await open()
        expect(dialog()).toBeNull()
        expect(onSelectSlot).toHaveBeenCalledTimes(1)

        const thu = column(screen.container, '2026-09-10')
        await drag(grid(screen.container), pointAt(thu, 540), pointAt(thu, 570))
        await open()
        expect(dialog()).not.toBeNull()
        expect(range()).toBe('2026-09-10T09:00 2026-09-10T09:30')
        expect(panel()?.querySelector('[data-probe-all-day]')?.textContent).toBe('false')
        expect(onSelectSlot).toHaveBeenCalledTimes(2)
        expect(onMutate).not.toHaveBeenCalled()

        panel()!.querySelector<HTMLElement>('[data-probe-save]')!.click()
        await open()
        expect(dialog()).toBeNull()
        const mutation: Mutation = onMutate.mock.calls[0][0]
        expect(mutation.kind).toBe('create')
        expect(mutation.after!.title).toBe('Planned')
        expect(mutation.after!.color).toBe('success')
        expect(iso(mutation.after!.start)).toBe('2026-09-10T09:00')
        expect(mutation.eventId).toMatch(/^event-/)
        expect(screen.component.getEvents()).toHaveLength(1)
        expect(screen.container.querySelector('[data-sch-event-id]')?.textContent).toContain(
            'Planned'
        )
    })

    it('opens with the dragged range instead of creating, and the ghost carries no title', async () => {
        const onMutate = vi.fn()
        const screen = render(CreatePanelScheduler, { date: anchor, onMutate })
        await settle()
        const thu = column(screen.container, '2026-09-10')
        const target = grid(screen.container)
        target.dispatchEvent(pointer('pointerdown', pointAt(thu, 540)))
        target.dispatchEvent(pointer('pointermove', pointAt(thu, 600)))
        await wait(30)
        const ghost = screen.container.querySelector('[data-sch-ghost]')
        expect(ghost).not.toBeNull()
        expect(ghost?.textContent).not.toMatch(/new event/i)
        target.dispatchEvent(pointer('pointermove', pointAt(thu, 660)))
        await wait(30)
        target.dispatchEvent(pointer('pointerup', pointAt(thu, 660)))
        await open()
        expect(onMutate).not.toHaveBeenCalled()
        expect(chips(screen.container)).toEqual([])
        expect(range()).toBe('2026-09-10T09:00 2026-09-10T11:00')
    })

    it('leaves a month cell click alone and opens several days from a drag across cells', async () => {
        const screen = render(CreatePanelScheduler, { date: anchor })
        await settle()
        await screen.getByRole('tab', { name: 'Month' }).click()
        await wait(120)
        tap(screen.container.querySelector('[data-sch-day="2026-09-22"]')!)
        await open()
        expect(dialog()).toBeNull()

        const from = screen.container.querySelector<HTMLElement>('[data-sch-day="2026-09-15"]')!
        const to = screen.container.querySelector<HTMLElement>('[data-sch-day="2026-09-17"]')!
        const centre = (element: Element) => {
            const rect = element.getBoundingClientRect()
            return { clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 }
        }
        await drag(grid(screen.container), centre(from), centre(to))
        await open()
        expect(range()).toBe('2026-09-15T00:00 2026-09-18T00:00')
        expect(panel()?.querySelector('[data-probe-all-day]')?.textContent).toBe('true')
        expect(screen.component.getEvents()).toHaveLength(0)
        panel()!.querySelector<HTMLElement>('[data-probe-cancel]')!.click()
        await open()
        expect(dialog()).toBeNull()
    })

    it('opens from Enter on the focused slot and from the application through draft', async () => {
        const screen = render(CreatePanelScheduler, { date: anchor })
        await settle()
        const target = grid(screen.container)
        target.focus()
        await settle()
        press(target, 'Enter')
        await open()
        expect(range()).toBe('2026-09-13T09:00 2026-09-13T09:30')
        press(dialog()!, 'Escape')
        await open()
        expect(dialog()).toBeNull()
        expect(screen.component.getDraft()).toBeNull()

        screen.component.openAt({
            start: parseZonedDateTime(`2026-09-11T14:00[${ZONE}]`),
            end: parseZonedDateTime(`2026-09-11T15:00[${ZONE}]`),
            allDay: false
        })
        await open()
        expect(range()).toBe('2026-09-11T14:00 2026-09-11T15:00')
    })

    it('gives a form fresh initial values on every open', async () => {
        const screen = render(CreatePanelScheduler, { date: anchor })
        await settle()
        const initial = () => panel()?.querySelector('[data-probe-initial]')?.textContent
        const thu = column(screen.container, '2026-09-10')
        await drag(grid(screen.container), pointAt(thu, 540), pointAt(thu, 570))
        await open()
        expect(initial()).toBe('2026-09-10T09:00')
        panel()!.querySelector<HTMLElement>('[data-probe-cancel]')!.click()
        await open()
        const fri = column(screen.container, '2026-09-11')
        await drag(grid(screen.container), pointAt(fri, 780), pointAt(fri, 840))
        await open()
        expect(range()).toBe('2026-09-11T13:00 2026-09-11T14:00')
        expect(initial()).toBe('2026-09-11T13:00')
    })

    it('never opens from the grid when creatable is off, only from draft', async () => {
        const onMutate = vi.fn()
        const screen = render(CreatePanelScheduler, {
            date: anchor,
            creatable: false,
            onMutate,
            initial: [input('a', '2026-09-09T09:00', '2026-09-09T10:00')]
        })
        await settle()
        const thu = column(screen.container, '2026-09-10')
        await drag(grid(screen.container), pointAt(thu, 540), pointAt(thu, 660))
        await open()
        expect(dialog()).toBeNull()
        tapAt(grid(screen.container), pointAt(thu, 550))
        await open()
        expect(dialog()).toBeNull()
        screen.component.openAt({
            start: parseZonedDateTime(`2026-09-11T14:00[${ZONE}]`),
            end: parseZonedDateTime(`2026-09-11T15:00[${ZONE}]`),
            allDay: false
        })
        await open()
        expect(range()).toBe('2026-09-11T14:00 2026-09-11T15:00')
        expect(onMutate).not.toHaveBeenCalled()
    })
})

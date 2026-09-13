import { describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-svelte'
import type { Mutation } from '../lib/types/mutation.types.js'
import DragSourceScheduler from './fixtures/DragSourceScheduler.svelte'
import {
    anchor,
    centre,
    column as timeColumn,
    frame,
    iso,
    pointAt,
    pointer,
    settle,
    wait
} from './fixtures/dom.js'

const item = { title: 'Site visit', color: 'warning' as const, data: { crew: 3 } }
const HOLD = 350

const source = (container: Element) => container.querySelector<HTMLElement>('[data-source]')!
const ghost = (root: Element) => root.querySelector('[data-sch-ghost]')

function column(root: Element, day: string) {
    const cell = timeColumn(root, day)
    const viewport = cell.closest<HTMLElement>('[data-scroll-area-viewport]')
    if (viewport) viewport.scrollTop = 0
    return cell
}

describe('drag from outside', () => {
    it('shows a ghost over the grid and creates the event where it is dropped', async () => {
        const onMutate = vi.fn()
        const screen = render(DragSourceScheduler, { item, onMutate, date: anchor })
        const handle = source(screen.container)
        const target = pointAt(column(screen.container, '2026-09-10'), 480)

        handle.dispatchEvent(pointer('pointerdown', centre(handle)))
        expect(handle.dataset.schDragging).toBe('')
        handle.dispatchEvent(pointer('pointermove', target))
        await frame()
        expect(ghost(screen.container)).not.toBeNull()
        expect(ghost(screen.container)?.textContent).toContain('Site visit')
        expect(screen.container.querySelectorAll('[data-sch-event]')).toHaveLength(0)

        handle.dispatchEvent(pointer('pointerup', target))
        await settle()

        expect(ghost(screen.container)).toBeNull()
        expect(handle.dataset.schDragging).toBeUndefined()
        const mutation: Mutation = onMutate.mock.calls[0][0]
        expect(mutation.kind).toBe('create')
        expect(mutation.before).toBeNull()
        expect(iso(mutation.after!.start)).toBe('2026-09-10T08:00')
        expect(iso(mutation.after!.end)).toBe('2026-09-10T09:00')
        expect(mutation.after!.color).toBe('warning')
        expect(mutation.after!.data).toEqual({ crew: 3 })
        expect(screen.component.getEvents()).toHaveLength(1)
        expect(screen.container.querySelector('[data-sch-event-id]')?.textContent).toContain(
            'Site visit'
        )
    })

    it('honours the duration and id the source supplies', async () => {
        const onMutate = vi.fn()
        const screen = render(DragSourceScheduler, {
            item: { ...item, id: 'visit-1', durationMinutes: 90 },
            onMutate,
            date: anchor
        })
        const handle = source(screen.container)
        const target = pointAt(column(screen.container, '2026-09-10'), 480)
        handle.dispatchEvent(pointer('pointerdown', centre(handle)))
        handle.dispatchEvent(pointer('pointermove', target))
        await frame()
        handle.dispatchEvent(pointer('pointerup', target))
        await settle()
        const mutation: Mutation = onMutate.mock.calls[0][0]
        expect(mutation.eventId).toBe('visit-1')
        expect(iso(mutation.after!.end)).toBe('2026-09-10T09:30')
    })

    it('drops onto a month cell as an all-day event', async () => {
        const onMutate = vi.fn()
        const screen = render(DragSourceScheduler, { item, onMutate, date: anchor, view: 'month' })
        const handle = source(screen.container)
        const cell = screen.container.querySelector<HTMLElement>('[data-sch-day="2026-09-15"]')!
        const target = centre(cell)
        handle.dispatchEvent(pointer('pointerdown', centre(handle)))
        handle.dispatchEvent(pointer('pointermove', target))
        await frame()
        expect(ghost(screen.container)).not.toBeNull()
        handle.dispatchEvent(pointer('pointerup', target))
        await settle()
        const mutation: Mutation = onMutate.mock.calls[0][0]
        expect(mutation.after!.allDay).toBe(true)
        expect(iso(mutation.after!.start)).toBe('2026-09-15T00:00')
        expect(iso(mutation.after!.end)).toBe('2026-09-16T00:00')
    })

    it('removes the ghost when the pointer leaves the grid and creates nothing on release', async () => {
        const onMutate = vi.fn()
        const screen = render(DragSourceScheduler, { item, onMutate, date: anchor })
        const handle = source(screen.container)
        handle.dispatchEvent(pointer('pointerdown', centre(handle)))
        handle.dispatchEvent(
            pointer('pointermove', pointAt(column(screen.container, '2026-09-10'), 480))
        )
        await frame()
        expect(ghost(screen.container)).not.toBeNull()
        handle.dispatchEvent(pointer('pointermove', centre(handle)))
        await frame()
        expect(ghost(screen.container)).toBeNull()
        handle.dispatchEvent(pointer('pointerup', centre(handle)))
        await settle()
        expect(onMutate).not.toHaveBeenCalled()
        expect(screen.component.getEvents()).toHaveLength(0)
    })

    it('cancels on Escape', async () => {
        const onMutate = vi.fn()
        const screen = render(DragSourceScheduler, { item, onMutate, date: anchor })
        const handle = source(screen.container)
        const target = pointAt(column(screen.container, '2026-09-10'), 480)
        handle.dispatchEvent(pointer('pointerdown', centre(handle)))
        handle.dispatchEvent(pointer('pointermove', target))
        await frame()
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
        await frame()
        expect(ghost(screen.container)).toBeNull()
        handle.dispatchEvent(pointer('pointerup', target))
        await settle()
        expect(onMutate).not.toHaveBeenCalled()
    })

    it('targets whichever scheduler is under the pointer', async () => {
        const screen = render(DragSourceScheduler, {
            item,
            date: anchor,
            view: 'month',
            second: true
        })
        const handle = source(screen.container)
        const second = screen.container.querySelector<HTMLElement>('[data-second]')!
        const first = screen.container.querySelector<HTMLElement>('[data-first]')!
        const target = centre(second.querySelector<HTMLElement>('[data-sch-day="2026-09-15"]')!)
        handle.dispatchEvent(pointer('pointerdown', centre(handle)))
        handle.dispatchEvent(pointer('pointermove', target))
        await frame()
        expect(ghost(second)).not.toBeNull()
        expect(ghost(first)).toBeNull()
        handle.dispatchEvent(pointer('pointerup', target))
        await settle()
        expect(screen.component.getOthers()).toHaveLength(1)
        expect(screen.component.getEvents()).toHaveLength(0)
    })

    it('needs a hold before a touch drag starts', async () => {
        const onMutate = vi.fn()
        const screen = render(DragSourceScheduler, { item, onMutate, date: anchor })
        const handle = source(screen.container)
        const target = pointAt(column(screen.container, '2026-09-10'), 480)
        handle.dispatchEvent(pointer('pointerdown', centre(handle), 'touch'))
        handle.dispatchEvent(pointer('pointermove', target, 'touch'))
        await frame()
        expect(ghost(screen.container)).toBeNull()
        handle.dispatchEvent(pointer('pointerup', target, 'touch'))
        await settle()
        expect(onMutate).not.toHaveBeenCalled()

        handle.dispatchEvent(pointer('pointerdown', centre(handle), 'touch'))
        await wait(HOLD)
        handle.dispatchEvent(pointer('pointermove', target, 'touch'))
        await frame()
        expect(ghost(screen.container)).not.toBeNull()
        handle.dispatchEvent(pointer('pointerup', target, 'touch'))
        await settle()
        expect(onMutate).toHaveBeenCalledTimes(1)
    })
})

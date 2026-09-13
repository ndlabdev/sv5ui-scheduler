import { parseZonedDateTime } from '@internationalized/date'
import { describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-svelte'
import type { EventInput } from '../lib/types/event.types.js'
import type { Mutation } from '../lib/types/mutation.types.js'
import BoundScheduler from './fixtures/BoundScheduler.svelte'

const anchor = parseZonedDateTime('2026-09-09T12:00[Asia/Ho_Chi_Minh]')
const quietWeek = parseZonedDateTime('2026-09-23T12:00[Asia/Ho_Chi_Minh]')
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
const frame = () => new Promise((resolve) => requestAnimationFrame(resolve))
const settle = () => new Promise((resolve) => setTimeout(resolve, 30))

function grid(container: Element) {
    return container.querySelector<HTMLElement>('[data-sch-time-grid] [role="application"]')!
}

function column(container: Element, day: string) {
    return container.querySelector<HTMLElement>(
        `[data-sch-day="${day}"][data-sch-day-index]:not([data-sch-all-day])`
    )!
}

function pointAt(element: HTMLElement, minutes: number, slotHeight = 24, slotMinutes = 30) {
    const rect = element.getBoundingClientRect()
    return {
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + (minutes / slotMinutes) * slotHeight + 1
    }
}

function pointer(type: string, at: { clientX: number; clientY: number }) {
    return new PointerEvent(type, {
        ...at,
        pointerId: 1,
        bubbles: true,
        isPrimary: true,
        button: 0
    })
}

async function drag(
    target: HTMLElement,
    from: { clientX: number; clientY: number },
    to: { clientX: number; clientY: number }
) {
    target.dispatchEvent(pointer('pointerdown', from))
    target.dispatchEvent(
        pointer('pointermove', {
            clientX: (from.clientX + to.clientX) / 2,
            clientY: (from.clientY + to.clientY) / 2
        })
    )
    await frame()
    target.dispatchEvent(pointer('pointermove', to))
    await frame()
    target.dispatchEvent(pointer('pointerup', to))
    await settle()
}

const iso = (date: { toString(): string }) => date.toString().slice(0, 16)

describe('drag to create', () => {
    it('creates an event spanning the dragged slots and persists it', async () => {
        const onMutate = vi.fn()
        const screen = render(BoundScheduler, { initial: [], onMutate, date: anchor })
        const wed = column(screen.container, '2026-09-09')
        await drag(grid(screen.container), pointAt(wed, 540), pointAt(wed, 660))

        expect(onMutate).toHaveBeenCalledTimes(1)
        const mutation: Mutation = onMutate.mock.calls[0][0]
        expect(mutation.kind).toBe('create')
        expect(iso(mutation.after!.start)).toBe('2026-09-09T09:00')
        expect(iso(mutation.after!.end)).toBe('2026-09-09T11:00')
        expect(screen.component.getEvents()).toHaveLength(1)
        expect(screen.container.querySelector('[data-sch-ghost]')).toBeNull()
    })

    it('does not create anything from a plain click', async () => {
        const onMutate = vi.fn()
        const screen = render(BoundScheduler, { initial: [], onMutate, date: anchor })
        const wed = column(screen.container, '2026-09-09')
        const at = pointAt(wed, 540)
        grid(screen.container).dispatchEvent(pointer('pointerdown', at))
        grid(screen.container).dispatchEvent(pointer('pointerup', at))
        await settle()
        expect(onMutate).not.toHaveBeenCalled()
        expect(screen.container.querySelector('[data-sch-focus]')).not.toBeNull()
    })

    it('creates one slot on double click', async () => {
        const onMutate = vi.fn()
        const screen = render(BoundScheduler, { initial: [], onMutate, date: anchor })
        const wed = column(screen.container, '2026-09-09')
        const at = pointAt(wed, 600)
        grid(screen.container).dispatchEvent(new MouseEvent('dblclick', { ...at, bubbles: true }))
        await settle()
        const mutation: Mutation = onMutate.mock.calls[0][0]
        expect(iso(mutation.after!.start)).toBe('2026-09-09T10:00')
        expect(iso(mutation.after!.end)).toBe('2026-09-09T10:30')
    })

    it('shows a ghost while dragging and removes it on Escape without creating', async () => {
        const onMutate = vi.fn()
        const screen = render(BoundScheduler, { initial: [], onMutate, date: anchor })
        const wed = column(screen.container, '2026-09-09')
        const target = grid(screen.container)
        target.dispatchEvent(pointer('pointerdown', pointAt(wed, 540)))
        target.dispatchEvent(pointer('pointermove', pointAt(wed, 660)))
        await frame()
        expect(screen.container.querySelector('[data-sch-ghost]')).not.toBeNull()

        target.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
        await settle()
        expect(screen.container.querySelector('[data-sch-ghost]')).toBeNull()
        target.dispatchEvent(pointer('pointerup', pointAt(wed, 660)))
        await settle()
        expect(onMutate).not.toHaveBeenCalled()
    })
})

describe('drag to move', () => {
    it('moves an event to another day and time, keeping its length', async () => {
        const onMutate = vi.fn()
        const screen = render(BoundScheduler, {
            initial: [input('a', '2026-09-09T09:00', '2026-09-09T10:00')],
            onMutate,
            date: anchor
        })
        const chip = screen.container.querySelector<HTMLElement>('[data-sch-event-id="a"]')!
        const wrapper = chip.closest<HTMLElement>('[data-sch-event]')!
        const rect = wrapper.getBoundingClientRect()
        const from = { clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 }
        const thu = column(screen.container, '2026-09-10')
        const to = pointAt(thu, 840 + 30)
        await drag(wrapper, from, to)

        const mutation: Mutation = onMutate.mock.calls[0][0]
        expect(mutation.kind).toBe('move')
        expect(iso(mutation.after!.start)).toBe('2026-09-10T14:00')
        expect(iso(mutation.after!.end)).toBe('2026-09-10T15:00')
        const moved = screen.container.querySelector('[data-sch-event-id="a"]')
        expect(moved?.closest('[data-sch-day]')?.getAttribute('data-sch-day')).toBe('2026-09-10')
    })

    it('leaves a locked event where it is', async () => {
        const onMutate = vi.fn()
        const screen = render(BoundScheduler, {
            initial: [input('a', '2026-09-09T09:00', '2026-09-09T10:00', { editable: false })],
            onMutate,
            date: anchor
        })
        const wrapper = screen.container
            .querySelector<HTMLElement>('[data-sch-event-id="a"]')!
            .closest<HTMLElement>('[data-sch-event]')!
        const rect = wrapper.getBoundingClientRect()
        const from = { clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 }
        await drag(wrapper, from, pointAt(column(screen.container, '2026-09-10'), 840))
        expect(onMutate).not.toHaveBeenCalled()
    })
})

describe('rollback and conflicts', () => {
    const live = (container: Element) =>
        container.querySelector('[aria-live="polite"][aria-atomic]')?.textContent?.trim()
    const returning = (root: ParentNode) =>
        [...root.querySelectorAll<HTMLElement>('*')].filter((element) =>
            element.getAnimations().some((animation) => animation.id === 'sch-return')
        )

    function deferred<T>() {
        let resolve!: (value: T) => void
        let reject!: (reason: unknown) => void
        const promise = new Promise<T>((res, rej) => {
            resolve = res
            reject = rej
        })
        return { promise, resolve, reject }
    }

    async function dragToThursday(container: Element) {
        const wrapper = container
            .querySelector<HTMLElement>('[data-sch-event-id="a"]')!
            .closest<HTMLElement>('[data-sch-event]')!
        const rect = wrapper.getBoundingClientRect()
        const from = { clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 }
        await drag(wrapper, from, pointAt(column(container, '2026-09-10'), 840 + 30))
    }

    const dayOf = (container: Element, id: string) =>
        container
            .querySelector(`[data-sch-event-id="${id}"]`)
            ?.closest('[data-sch-day]')
            ?.getAttribute('data-sch-day')

    it('slides a failed move back to where it was and announces the rollback', async () => {
        const server = deferred<void>()
        const screen = render(BoundScheduler, {
            initial: [input('a', '2026-09-09T09:00', '2026-09-09T10:00')],
            onMutate: () => server.promise,
            date: anchor
        })
        await dragToThursday(screen.container)
        expect(dayOf(screen.container, 'a')).toBe('2026-09-10')
        const optimistic = screen.container
            .querySelector('[data-sch-event-id="a"]')!
            .closest<HTMLElement>('[data-sch-event]')!
            .getBoundingClientRect()

        server.reject(new Error('offline'))
        await settle()

        expect(dayOf(screen.container, 'a')).toBe('2026-09-09')
        expect(live(screen.container)).toBe('Could not save a, change reverted')
        const [moving] = returning(screen.container)
        expect(moving?.dataset.schEvent).toBe('a')
        const [animation] = moving.getAnimations()
        const first = (animation.effect as KeyframeEffect).getKeyframes()[0]
        animation.finish()
        const resting = moving.getBoundingClientRect()
        const expected = `translate(${optimistic.left - resting.left}px, ${optimistic.top - resting.top}px)`
        expect(first.transform).toBe(expected)
        expect(moving.style.top).toBe(`${18 * 24}px`)
    })

    it('fades out a created event that failed to persist and cleans up after itself', async () => {
        const server = deferred<void>()
        const screen = render(BoundScheduler, {
            initial: [],
            onMutate: () => server.promise,
            date: anchor
        })
        const wed = column(screen.container, '2026-09-09')
        await drag(grid(screen.container), pointAt(wed, 540), pointAt(wed, 660))
        expect(screen.container.querySelectorAll('[data-sch-event]')).toHaveLength(1)

        server.reject(new Error('offline'))
        await settle()

        expect(screen.container.querySelectorAll('[data-sch-event]')).toHaveLength(0)
        expect(screen.container.querySelectorAll('[data-sch-event-id]')).toHaveLength(0)
        expect(screen.component.getEvents()).toHaveLength(0)
        const [ghost] = returning(screen.container)
        expect(ghost?.querySelector('[id], [data-sch-event-id]')).toBeNull()
        expect(ghost?.getAttribute('aria-hidden')).toBe('true')
        expect(ghost?.inert).toBe(true)
        expect(live(screen.container)).toMatch(/^Could not save .*, change reverted$/)

        await new Promise((resolve) => setTimeout(resolve, 400))
        expect(returning(screen.container)).toHaveLength(0)
        expect(screen.container.contains(ghost)).toBe(false)
    })

    it('moves to the server version on a conflict and announces it', async () => {
        const screen = render(BoundScheduler, {
            initial: [input('a', '2026-09-09T09:00', '2026-09-09T10:00')],
            onMutate: (mutation) => ({
                id: 'a',
                title: 'a',
                start: mutation.before!.start.add({ hours: 3 }),
                end: mutation.before!.end.add({ hours: 3 })
            }),
            date: anchor
        })
        await dragToThursday(screen.container)

        expect(dayOf(screen.container, 'a')).toBe('2026-09-09')
        const wrapper = screen.container
            .querySelector('[data-sch-event-id="a"]')!
            .closest<HTMLElement>('[data-sch-event]')!
        expect(wrapper.style.top).toBe(`${24 * 24}px`)
        expect(live(screen.container)).toBe('a was updated elsewhere')
        expect(returning(screen.container).map((element) => element.dataset.schEvent)).toEqual([
            'a'
        ])
    })

    it('fades a deleted event back in when the delete fails', async () => {
        const server = deferred<void>()
        const screen = render(BoundScheduler, {
            initial: [input('a', '2026-09-09T09:00', '2026-09-09T10:00')],
            onMutate: () => server.promise,
            date: anchor
        })
        await screen.getByText('a', { exact: true }).click()
        grid(screen.container).dispatchEvent(
            new KeyboardEvent('keydown', { key: 'Delete', bubbles: true })
        )
        await settle()
        expect(screen.container.querySelectorAll('[data-sch-event]')).toHaveLength(0)

        server.reject(new Error('offline'))
        await settle()

        expect(dayOf(screen.container, 'a')).toBe('2026-09-09')
        expect(returning(screen.container).map((element) => element.dataset.schEvent)).toEqual([
            'a'
        ])
        expect(live(screen.container)).toBe('Could not save a, change reverted')
    })

    it('stays still when the change persists', async () => {
        const screen = render(BoundScheduler, {
            initial: [input('a', '2026-09-09T09:00', '2026-09-09T10:00')],
            onMutate: () => undefined,
            date: anchor
        })
        await dragToThursday(screen.container)
        expect(dayOf(screen.container, 'a')).toBe('2026-09-10')
        expect(returning(screen.container)).toHaveLength(0)
    })
})

describe('drag to resize', () => {
    it('extends the end when dragging the bottom edge', async () => {
        const onMutate = vi.fn()
        const screen = render(BoundScheduler, {
            initial: [input('a', '2026-09-09T09:00', '2026-09-09T10:00')],
            onMutate,
            date: anchor
        })
        const wrapper = screen.container
            .querySelector<HTMLElement>('[data-sch-event-id="a"]')!
            .closest<HTMLElement>('[data-sch-event]')!
        const rect = wrapper.getBoundingClientRect()
        const from = { clientX: rect.left + rect.width / 2, clientY: rect.bottom - 2 }
        const to = pointAt(column(screen.container, '2026-09-09'), 690)
        await drag(wrapper, from, to)

        const mutation: Mutation = onMutate.mock.calls[0][0]
        expect(mutation.kind).toBe('resize')
        expect(iso(mutation.after!.start)).toBe('2026-09-09T09:00')
        expect(iso(mutation.after!.end)).toBe('2026-09-09T11:30')
    })
})

describe('keyboard', () => {
    it('focuses a slot on Tab, moves with arrows and creates with Enter', async () => {
        const onMutate = vi.fn()
        const screen = render(BoundScheduler, { initial: [], onMutate, date: quietWeek })
        const target = grid(screen.container)
        expect(target.tabIndex).toBe(0)
        expect(target.getAttribute('aria-label')).toBe('Calendar, Week view')

        target.focus()
        await settle()
        expect(screen.container.querySelector('[data-sch-focus]')).not.toBeNull()

        target.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
        target.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
        target.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
        await settle()

        expect(onMutate).toHaveBeenCalledTimes(1)
        const mutation: Mutation = onMutate.mock.calls[0][0]
        expect(mutation.kind).toBe('create')
        expect(iso(mutation.after!.start)).toBe('2026-09-22T09:30')
    })

    it('deletes the selected event with Delete and clears selection with Escape', async () => {
        const onMutate = vi.fn()
        const screen = render(BoundScheduler, {
            initial: [input('a', '2026-09-09T09:00', '2026-09-09T10:00')],
            onMutate,
            date: anchor
        })
        await screen.getByText('a', { exact: true }).click()
        const target = grid(screen.container)
        target.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true }))
        await settle()

        expect(onMutate).toHaveBeenCalledWith(
            expect.objectContaining({ kind: 'delete', eventId: 'a' })
        )
        expect(screen.component.getEvents()).toHaveLength(0)
    })

    it('pages to the next week when arrowing past the last column', async () => {
        const screen = render(BoundScheduler, { initial: [], date: anchor })
        const target = grid(screen.container)
        target.focus()
        await settle()
        for (let i = 0; i < 7; i++) {
            target.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
        }
        await settle()
        expect(screen.container.querySelector('[data-sch-day="2026-09-14"]')).not.toBeNull()
    })

    it('announces the focused slot to assistive tech', async () => {
        const screen = render(BoundScheduler, { initial: [], date: anchor })
        const target = grid(screen.container)
        target.focus()
        target.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
        await settle()
        const live = screen.container.querySelector('[aria-live="polite"][aria-atomic]')
        expect(live?.textContent).toContain('September')
    })
})

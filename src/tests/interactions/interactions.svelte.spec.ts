import { parseZonedDateTime } from '@internationalized/date'
import { describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-svelte'
import type { Mutation } from '../../lib/types/mutation.types.js'
import { RETURN_ANIMATION_ID } from '../../lib/interactions/engine/motion.js'
import BoundScheduler from '../fixtures/BoundScheduler.svelte'
import {
    anchor,
    centre,
    column,
    drag,
    frame,
    grid,
    input,
    iso,
    pointAt,
    pointer,
    settle,
    wait
} from '../fixtures/dom.js'

const quietWeek = parseZonedDateTime('2026-09-23T12:00[Asia/Ho_Chi_Minh]')

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

    it('shows nothing on pointer down until the pointer actually moves', async () => {
        const screen = render(BoundScheduler, { initial: [], date: anchor })
        const wed = column(screen.container, '2026-09-09')
        const target = grid(screen.container)
        target.dispatchEvent(pointer('pointerdown', pointAt(wed, 540)))
        await frame()
        expect(screen.container.querySelector('[data-sch-ghost]')).toBeNull()
        const ring = screen.container.querySelector<HTMLElement>('[data-sch-focus]')
        expect(ring).not.toBeNull()
        expect(getComputedStyle(ring!).visibility).toBe('hidden')
        target.dispatchEvent(pointer('pointermove', pointAt(wed, 600)))
        await frame()
        expect(screen.container.querySelector('[data-sch-ghost]')).not.toBeNull()
        target.dispatchEvent(pointer('pointerup', pointAt(wed, 600)))
        await settle()
    })

    it('shows the focus ring only when the grid is focused from the keyboard', async () => {
        const screen = render(BoundScheduler, { initial: [], date: anchor })
        const target = grid(screen.container)
        target.focus()
        target.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
        await frame()
        const ring = screen.container.querySelector<HTMLElement>('[data-sch-focus]')!
        expect(target.matches(':focus-visible')).toBe(true)
        expect(getComputedStyle(ring).visibility).toBe('visible')
    })

    it('creates nothing on double click', async () => {
        const onMutate = vi.fn()
        const screen = render(BoundScheduler, { initial: [], onMutate, date: anchor })
        const wed = column(screen.container, '2026-09-09')
        const at = pointAt(wed, 600)
        const target = grid(screen.container)
        for (let i = 0; i < 2; i += 1) {
            target.dispatchEvent(pointer('pointerdown', at))
            target.dispatchEvent(pointer('pointerup', at))
            target.dispatchEvent(new MouseEvent('click', { ...at, bubbles: true, detail: i + 1 }))
        }
        target.dispatchEvent(new MouseEvent('dblclick', { ...at, bubbles: true }))
        await settle()
        expect(onMutate).not.toHaveBeenCalled()
        expect(screen.component.getEvents()).toHaveLength(0)
        expect(screen.container.querySelector('[data-sch-event]')).toBeNull()
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

    it('keeps one ghost element that slides across columns instead of remounting', async () => {
        const screen = render(BoundScheduler, {
            initial: [input('a', '2026-09-09T09:00', '2026-09-09T10:00')],
            date: anchor
        })
        const wrapper = screen.container
            .querySelector<HTMLElement>('[data-sch-event-id="a"]')!
            .closest<HTMLElement>('[data-sch-event]')!
        const rect = wrapper.getBoundingClientRect()
        const from = { clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 }
        wrapper.dispatchEvent(pointer('pointerdown', from))
        wrapper.dispatchEvent(
            pointer('pointermove', pointAt(column(screen.container, '2026-09-10'), 600))
        )
        await frame()
        const ghost = screen.container.querySelector<HTMLElement>('[data-sch-ghost]')!
        expect(ghost.closest('[data-sch-day]')).toBeNull()
        expect(getComputedStyle(ghost).transitionProperty).toContain('top')
        expect(
            getComputedStyle(screen.container.querySelector('[data-sch-time-grid]')!).cursor
        ).toBe('grabbing')

        wrapper.dispatchEvent(
            pointer('pointermove', pointAt(column(screen.container, '2026-09-12'), 720))
        )
        await frame()
        expect(screen.container.querySelector('[data-sch-ghost]')).toBe(ghost)
        expect(ghost.style.insetInlineStart).not.toBe('')

        wrapper.dispatchEvent(
            pointer('pointerup', pointAt(column(screen.container, '2026-09-12'), 720))
        )
        await settle()
        expect(screen.container.querySelector('[data-sch-ghost]')).toBeNull()
        expect(
            getComputedStyle(screen.container.querySelector('[data-sch-time-grid]')!).cursor
        ).not.toBe('grabbing')
    })

    it('slides one ghost across month cells and rows and drops on the cell under the pointer', async () => {
        const onMutate = vi.fn()
        const screen = render(BoundScheduler, {
            initial: [input('trip', '2026-09-09', '2026-09-10', { allDay: true })],
            onMutate,
            date: anchor,
            view: 'month'
        })
        const cell = (day: string) =>
            screen.container.querySelector<HTMLElement>(`[data-sch-day="${day}"]`)!
        const wrapper = screen.container.querySelector<HTMLElement>('[data-sch-event="trip"]')!
        wrapper.dispatchEvent(pointer('pointerdown', centre(wrapper)))
        wrapper.dispatchEvent(pointer('pointermove', centre(cell('2026-09-11'))))
        await frame()
        const ghost = screen.container.querySelector<HTMLElement>('[data-sch-ghost]')!
        expect(ghost.parentElement).toBe(
            screen.container.querySelector('[data-sch-month-grid] [role="application"]')
        )
        expect(getComputedStyle(ghost).transitionProperty).toContain('top')
        const before = ghost.style.top

        wrapper.dispatchEvent(pointer('pointermove', centre(cell('2026-09-17'))))
        await frame()
        expect(screen.container.querySelector('[data-sch-ghost]')).toBe(ghost)
        expect(ghost.style.top).not.toBe(before)
        expect(
            getComputedStyle(screen.container.querySelector('[data-sch-month-grid]')!).cursor
        ).toBe('grabbing')

        wrapper.dispatchEvent(pointer('pointerup', centre(cell('2026-09-17'))))
        await settle()
        const mutation: Mutation = onMutate.mock.calls[0][0]
        expect(iso(mutation.after!.start)).toBe('2026-09-17T00:00')
        expect(screen.container.querySelector('[data-sch-ghost]')).toBeNull()
    })

    it('makes room for the month ghost instead of covering the chips already there', async () => {
        const screen = render(BoundScheduler, {
            initial: [
                input('a', '2026-09-09T09:00', '2026-09-09T10:00'),
                input('b', '2026-09-16T09:00', '2026-09-16T10:00')
            ],
            date: anchor,
            view: 'month'
        })
        const cell = (day: string) =>
            screen.container.querySelector<HTMLElement>(`[data-sch-day="${day}"]`)!
        const top = (id: string) =>
            screen.container
                .querySelector<HTMLElement>(`[data-sch-event="${id}"]`)!
                .getBoundingClientRect().top
        const bTop = top('b')
        const wrapper = screen.container.querySelector<HTMLElement>('[data-sch-event="a"]')!
        wrapper.dispatchEvent(pointer('pointerdown', centre(wrapper)))
        wrapper.dispatchEvent(pointer('pointermove', centre(cell('2026-09-16'))))
        await frame()

        const ghost = screen.container.querySelector<HTMLElement>('[data-sch-ghost]')!
        expect(getComputedStyle(wrapper).visibility).toBe('hidden')
        expect(Math.round(ghost.getBoundingClientRect().top)).toBe(Math.round(bTop))
        expect(Math.round(top('b'))).toBe(Math.round(bTop + 24))
        const overlaps = [
            ...screen.container.querySelectorAll<HTMLElement>('[data-sch-event]')
        ].filter((element) => {
            if (element === wrapper) return false
            const a = element.getBoundingClientRect()
            const g = ghost.getBoundingClientRect()
            return (
                a.top < g.bottom - 2 &&
                a.bottom > g.top + 2 &&
                a.left < g.right - 2 &&
                a.right > g.left + 2
            )
        })
        expect(overlaps).toEqual([])

        wrapper.dispatchEvent(pointer('pointerup', centre(cell('2026-09-16'))))
        await settle()
        const moved = screen.container.querySelector<HTMLElement>('[data-sch-event="a"]')!
        expect(getComputedStyle(moved).visibility).toBe('visible')
        expect(moved.closest('[role="application"]')).not.toBeNull()
        expect(Math.round(top('b'))).toBe(Math.round(bTop + 24))
    })

    it('keeps the month ghost visible in a cell that is already full', async () => {
        const many = Array.from({ length: 12 }, (_, i) =>
            input(
                `m${i}`,
                `2026-09-16T${String(i + 1).padStart(2, '0')}:00`,
                `2026-09-16T${String(i + 1).padStart(2, '0')}:30`
            )
        )
        const screen = render(BoundScheduler, {
            initial: [input('a', '2026-09-09T09:00', '2026-09-09T10:00'), ...many],
            date: anchor,
            view: 'month'
        })
        const cell = screen.container.querySelector<HTMLElement>('[data-sch-day="2026-09-16"]')!
        const rect = cell.getBoundingClientRect()
        const at = { clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 }
        const more = () =>
            Number(cell.querySelector('[data-sch-more]')?.textContent?.replace('+', ''))
        const before = more()
        expect(before).toBeGreaterThan(0)
        const wrapper = screen.container.querySelector<HTMLElement>('[data-sch-event="a"]')!
        const from = wrapper.getBoundingClientRect()
        wrapper.dispatchEvent(
            pointer('pointerdown', {
                clientX: from.left + from.width / 2,
                clientY: from.top + from.height / 2
            })
        )
        wrapper.dispatchEvent(pointer('pointermove', at))
        await frame()
        const ghost = screen.container.querySelector<HTMLElement>('[data-sch-ghost]')!
        const g = ghost.getBoundingClientRect()
        expect(g.top).toBeGreaterThanOrEqual(rect.top)
        expect(g.bottom).toBeLessThanOrEqual(rect.bottom)
        expect(more()).toBe(before + 1)
        const covered = [
            ...cell.parentElement!.parentElement!.querySelectorAll<HTMLElement>('[data-sch-event]')
        ].filter((element) => {
            const a = element.getBoundingClientRect()
            return (
                a.top < g.bottom - 2 &&
                a.bottom > g.top + 2 &&
                a.left < g.right - 2 &&
                a.right > g.left + 2
            )
        })
        expect(covered).toEqual([])
        wrapper.dispatchEvent(pointer('pointerup', at))
        await settle()
    })

    it('adds a lane in the all-day row for the ghost instead of covering the chip there', async () => {
        const screen = render(BoundScheduler, {
            initial: [
                input('a', '2026-09-09T09:00', '2026-09-09T10:00'),
                input('fest', '2026-09-10', '2026-09-11', { allDay: true })
            ],
            date: anchor
        })
        const allDayCell = screen.container.querySelector<HTMLElement>(
            '[data-sch-day-index="3"][data-sch-all-day]'
        )!
        const rect = allDayCell.getBoundingClientRect()
        const target = { clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 }
        const fest = screen.container.querySelector<HTMLElement>('[data-sch-event="fest"]')!
        const festTop = fest.getBoundingClientRect().top
        const wrapper = screen.container.querySelector<HTMLElement>('[data-sch-event="a"]')!
        const from = wrapper.getBoundingClientRect()
        wrapper.dispatchEvent(
            pointer('pointerdown', {
                clientX: from.left + from.width / 2,
                clientY: from.top + from.height / 2
            })
        )
        wrapper.dispatchEvent(pointer('pointermove', target))
        await frame()
        const ghost = screen.container.querySelector<HTMLElement>('[data-sch-ghost]')!
        const g = ghost.getBoundingClientRect()
        const f = fest.getBoundingClientRect()
        const row = allDayCell.getBoundingClientRect()
        expect(g.top).toBeGreaterThanOrEqual(row.top - 1)
        expect(g.bottom).toBeLessThanOrEqual(row.bottom + 1)
        expect(g.bottom <= f.top + 1 || g.top >= f.bottom - 1).toBe(true)
        expect(Math.round(f.top)).toBeGreaterThanOrEqual(Math.round(festTop))
        wrapper.dispatchEvent(pointer('pointerup', target))
        await settle()
        expect(screen.container.querySelector('[data-sch-ghost]')).toBeNull()
    })

    it('does not map the pointer to hours hidden behind the scroll viewport', async () => {
        const screen = render(BoundScheduler, {
            initial: [input('a', '2026-09-09T13:00', '2026-09-09T14:00')],
            date: anchor
        })
        const host = screen.container.firstElementChild as HTMLElement
        host.style.height = '500px'
        const viewport = screen.container.querySelector<HTMLElement>('[data-scroll-area-viewport]')!
        viewport.scrollTop = 12 * 48
        await frame()
        const wrapper = screen.container.querySelector<HTMLElement>('[data-sch-event="a"]')!
        const from = wrapper.getBoundingClientRect()
        wrapper.dispatchEvent(
            pointer('pointerdown', {
                clientX: from.left + from.width / 2,
                clientY: from.top + from.height / 2
            })
        )
        wrapper.dispatchEvent(
            pointer('pointermove', { clientX: from.left + from.width / 2, clientY: from.top + 48 })
        )
        await frame()
        const ghost = screen.container.querySelector<HTMLElement>('[data-sch-ghost]')!
        const settled = ghost.style.top
        const header = screen.container.querySelector<HTMLElement>(
            '[data-sch-day="2026-09-09"]:not([data-sch-day-index])'
        )!
        const h = header.getBoundingClientRect()
        wrapper.dispatchEvent(
            pointer('pointermove', { clientX: h.left + h.width / 2, clientY: h.top + h.height / 2 })
        )
        await frame()
        expect(ghost.style.top).toBe(settled)
        wrapper.dispatchEvent(
            pointer('pointerup', { clientX: h.left + h.width / 2, clientY: h.top + 2 })
        )
        await settle()
    })

    it('keeps the clock time when a timed event is moved to another day of the month grid', async () => {
        const onMutate = vi.fn()
        const screen = render(BoundScheduler, {
            initial: [input('a', '2026-09-09T13:15', '2026-09-09T14:45')],
            onMutate,
            date: anchor,
            view: 'month'
        })
        const cell = screen.container.querySelector<HTMLElement>('[data-sch-day="2026-09-17"]')!
        const rect = cell.getBoundingClientRect()
        const at = { clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 }
        const wrapper = screen.container.querySelector<HTMLElement>('[data-sch-event="a"]')!
        const from = wrapper.getBoundingClientRect()
        wrapper.dispatchEvent(
            pointer('pointerdown', {
                clientX: from.left + from.width / 2,
                clientY: from.top + from.height / 2
            })
        )
        wrapper.dispatchEvent(pointer('pointermove', at))
        await frame()
        expect(screen.container.querySelector('[data-sch-ghost]')?.textContent).toContain('1:15')
        wrapper.dispatchEvent(pointer('pointerup', at))
        await settle()
        const mutation: Mutation = onMutate.mock.calls[0][0]
        expect(mutation.after!.allDay).not.toBe(true)
        expect(iso(mutation.after!.start)).toBe('2026-09-17T13:15')
        expect(iso(mutation.after!.end)).toBe('2026-09-17T14:45')
    })

    it('draws both segments of a ghost that crosses midnight at their full size', async () => {
        const screen = render(BoundScheduler, {
            initial: [input('ship', '2026-09-11T22:30', '2026-09-12T00:30')],
            date: anchor
        })
        const wrapper = screen.container.querySelector<HTMLElement>('[data-sch-event="ship"]')!
        const rect = wrapper.getBoundingClientRect()
        const from = { clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 }
        wrapper.dispatchEvent(pointer('pointerdown', from))
        wrapper.dispatchEvent(
            pointer('pointermove', { clientX: from.clientX, clientY: from.clientY + 24 })
        )
        await frame()
        const ghosts = [...screen.container.querySelectorAll<HTMLElement>('[data-sch-ghost]')]
        expect(ghosts).toHaveLength(2)
        const byTop = ghosts.sort(
            (a, b) => parseFloat(a.style.insetInlineStart) - parseFloat(b.style.insetInlineStart)
        )
        expect(byTop[0].style.top).toBe(`${(23 * 60 * 24) / 30}px`)
        expect(byTop[0].style.height).toBe(`${(60 * 24) / 30}px`)
        expect(byTop[1].style.top).toBe('0px')
        expect(byTop[1].style.height).toBe('48px')
        expect(parseFloat(byTop[0].style.insetInlineStart)).toBeCloseTo((4 * 100) / 7, 2)
        expect(parseFloat(byTop[1].style.insetInlineStart)).toBeCloseTo((5 * 100) / 7, 2)
        for (const ghost of ghosts) {
            const g = ghost.getBoundingClientRect()
            expect(g.height).toBeGreaterThan(20)
        }
        wrapper.dispatchEvent(
            pointer('pointerup', { clientX: from.clientX, clientY: from.clientY + 24 })
        )
        await settle()
    })

    it('maps the pointer to the right time while the grid is scrolled', async () => {
        const onMutate = vi.fn()
        const screen = render(BoundScheduler, { initial: [], onMutate, date: anchor })
        const host = screen.container.firstElementChild as HTMLElement
        host.style.height = '500px'
        const viewport = screen.container.querySelector<HTMLElement>('[data-scroll-area-viewport]')!
        viewport.scrollTop = 12 * 48
        await frame()
        const wed = column(screen.container, '2026-09-09')
        const target = grid(screen.container)
        const start = pointAt(wed, 14 * 60)
        const end = pointAt(wed, 15 * 60)
        expect(start.clientY).toBeGreaterThan(viewport.getBoundingClientRect().top)
        target.dispatchEvent(pointer('pointerdown', start))
        target.dispatchEvent(pointer('pointermove', end))
        await frame()
        expect(screen.container.querySelector<HTMLElement>('[data-sch-ghost]')!.style.top).toBe(
            `${14 * 48}px`
        )
        target.dispatchEvent(pointer('pointerup', end))
        await settle()
        const mutation: Mutation = onMutate.mock.calls[0][0]
        expect(iso(mutation.after!.start)).toBe('2026-09-09T14:00')
        expect(iso(mutation.after!.end)).toBe('2026-09-09T15:00')
    })

    it('scrolls the grid while the pointer waits near the bottom edge and follows it', async () => {
        const screen = render(BoundScheduler, {
            initial: [input('a', '2026-09-09T09:00', '2026-09-09T10:00')],
            date: anchor,
            view: 'day'
        })
        const host = screen.container.firstElementChild as HTMLElement
        host.style.height = '500px'
        const viewport = screen.container.querySelector<HTMLElement>('[data-scroll-area-viewport]')!
        viewport.scrollTop = 8 * 48
        await frame()
        const wrapper = screen.container.querySelector<HTMLElement>('[data-sch-event="a"]')!
        const from = wrapper.getBoundingClientRect()
        const at = { clientX: from.left + from.width / 2, clientY: from.top + from.height / 2 }
        const edge = { clientX: at.clientX, clientY: viewport.getBoundingClientRect().bottom - 8 }
        wrapper.dispatchEvent(pointer('pointerdown', at))
        wrapper.dispatchEvent(pointer('pointermove', edge))
        await frame()
        const ghost = screen.container.querySelector<HTMLElement>('[data-sch-ghost]')!
        const before = { scroll: viewport.scrollTop, top: parseFloat(ghost.style.top) }
        await expect
            .poll(() => viewport.scrollTop, { timeout: 2000 })
            .toBeGreaterThan(before.scroll + 48)
        await expect
            .poll(() => parseFloat(ghost.style.top), { timeout: 2000 })
            .toBeGreaterThan(before.top + 48)
        expect(viewport.scrollTop + viewport.clientHeight).toBeLessThan(viewport.scrollHeight - 100)
        wrapper.dispatchEvent(pointer('pointerup', edge))
        await settle()
        const settledScroll = viewport.scrollTop
        await wait(120)
        expect(viewport.scrollTop).toBe(settledScroll)
    })

    it('stops scrolling as soon as the pointer is released', async () => {
        const screen = render(BoundScheduler, { initial: [], date: anchor, view: 'day' })
        const host = screen.container.firstElementChild as HTMLElement
        host.style.height = '500px'
        const viewport = screen.container.querySelector<HTMLElement>('[data-scroll-area-viewport]')!
        viewport.scrollTop = 8 * 48
        await frame()
        const target = grid(screen.container)
        const box = viewport.getBoundingClientRect()
        const start = { clientX: box.left + box.width / 2, clientY: box.top + box.height / 2 }
        const edge = { clientX: start.clientX, clientY: box.bottom - 8 }
        target.dispatchEvent(pointer('pointerdown', start))
        target.dispatchEvent(pointer('pointermove', edge))
        await expect.poll(() => viewport.scrollTop, { timeout: 2000 }).toBeGreaterThan(8 * 48 + 48)
        target.dispatchEvent(pointer('pointerup', edge))
        await settle()
        const settledScroll = viewport.scrollTop
        expect(settledScroll + viewport.clientHeight).toBeLessThan(viewport.scrollHeight - 100)
        await wait(120)
        expect(viewport.scrollTop).toBe(settledScroll)
    })

    it('re-maps the pointer after the grid was scrolled by other means mid-drag', async () => {
        const screen = render(BoundScheduler, {
            initial: [input('a', '2026-09-09T09:00', '2026-09-09T10:00')],
            date: anchor,
            view: 'day'
        })
        const host = screen.container.firstElementChild as HTMLElement
        host.style.height = '500px'
        const viewport = screen.container.querySelector<HTMLElement>('[data-scroll-area-viewport]')!
        viewport.scrollTop = 8 * 48
        await frame()
        const wrapper = screen.container.querySelector<HTMLElement>('[data-sch-event="a"]')!
        const from = wrapper.getBoundingClientRect()
        const at = { clientX: from.left + from.width / 2, clientY: from.top + from.height / 2 }
        wrapper.dispatchEvent(pointer('pointerdown', at))
        wrapper.dispatchEvent(pointer('pointermove', { ...at, clientY: at.clientY + 48 }))
        await frame()
        const ghost = screen.container.querySelector<HTMLElement>('[data-sch-ghost]')!
        expect(ghost.style.top).toBe(`${10 * 48}px`)

        viewport.scrollTop += 96
        viewport.dispatchEvent(new Event('scroll', { bubbles: false }))
        wrapper.dispatchEvent(pointer('pointermove', { ...at, clientY: at.clientY + 49 }))
        await frame()
        expect(ghost.style.top).toBe(`${12 * 48}px`)
        wrapper.dispatchEvent(pointer('pointerup', { ...at, clientY: at.clientY + 49 }))
        await settle()
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
            element.getAnimations().some((animation) => animation.id === RETURN_ANIMATION_ID)
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
        const [x, y] = [...String(first.transform).matchAll(/-?[\d.]+/g)].map((match) =>
            Number(match[0])
        )
        expect(x).toBeCloseTo(optimistic.left - resting.left, 1)
        expect(y).toBeCloseTo(optimistic.top - resting.top, 1)
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

describe('resize across days', () => {
    const rightEdge = (element: Element) => {
        const rect = element.getBoundingClientRect()
        return { clientX: rect.right - 3, clientY: rect.top + rect.height / 2 }
    }
    const leftEdge = (element: Element) => {
        const rect = element.getBoundingClientRect()
        return { clientX: rect.left + 3, clientY: rect.top + rect.height / 2 }
    }

    it('extends an all-day event in the all-day row by dragging its end edge', async () => {
        const onMutate = vi.fn()
        const screen = render(BoundScheduler, {
            initial: [input('trip', '2026-09-08', '2026-09-10', { allDay: true })],
            onMutate,
            date: anchor
        })
        const wrapper = screen.container.querySelector<HTMLElement>('[data-sch-event="trip"]')!
        wrapper.dispatchEvent(pointer('pointermove', rightEdge(wrapper)))
        expect(wrapper.dataset.schEdge).toBe('x')
        expect(getComputedStyle(wrapper.querySelector('button')!).cursor).toBe('ew-resize')
        const thu = screen.container.querySelector<HTMLElement>(
            '[data-sch-day-index="3"][data-sch-all-day]'
        )!
        await drag(wrapper, rightEdge(wrapper), centre(thu))
        const mutation: Mutation = onMutate.mock.calls[0][0]
        expect(mutation.kind).toBe('resize')
        expect(iso(mutation.after!.start)).toBe('2026-09-08T00:00')
        expect(iso(mutation.after!.end)).toBe('2026-09-11T00:00')
        expect(mutation.after!.allDay).toBe(true)
    })

    it('moves the start edge of a month span and keeps a timed event on the clock', async () => {
        const onMutate = vi.fn()
        const screen = render(BoundScheduler, {
            initial: [input('a', '2026-09-09T13:15', '2026-09-10T14:45')],
            onMutate,
            date: anchor,
            view: 'month'
        })
        const wrapper = screen.container.querySelector<HTMLElement>('[data-sch-event="a"]')!
        const mon = screen.container.querySelector<HTMLElement>('[data-sch-day="2026-09-07"]')!
        await drag(wrapper, leftEdge(wrapper), centre(mon))
        const mutation: Mutation = onMutate.mock.calls[0][0]
        expect(mutation.kind).toBe('resize')
        expect(iso(mutation.after!.start)).toBe('2026-09-07T13:15')
        expect(iso(mutation.after!.end)).toBe('2026-09-10T14:45')
        expect(mutation.after!.allDay).not.toBe(true)
    })

    it('offers no edge where a span continues into the next row', async () => {
        const screen = render(BoundScheduler, {
            initial: [input('long', '2026-09-12', '2026-09-16', { allDay: true })],
            date: anchor,
            view: 'month'
        })
        const [first, second] = [
            ...screen.container.querySelectorAll<HTMLElement>('[data-sch-event="long"]')
        ]
        first.dispatchEvent(pointer('pointermove', rightEdge(first)))
        expect(first.dataset.schEdge).toBeUndefined()
        second.dispatchEvent(pointer('pointermove', leftEdge(second)))
        expect(second.dataset.schEdge).toBeUndefined()
        second.dispatchEvent(pointer('pointermove', rightEdge(second)))
        expect(second.dataset.schEdge).toBe('x')
    })

    it('treats the left edge as the end of the event in a right to left grid', async () => {
        const onMutate = vi.fn()
        const screen = render(BoundScheduler, {
            initial: [input('trip', '2026-09-08', '2026-09-10', { allDay: true })],
            onMutate,
            date: anchor,
            dir: 'rtl'
        })
        const wrapper = screen.container.querySelector<HTMLElement>('[data-sch-event="trip"]')!
        const thu = screen.container.querySelector<HTMLElement>(
            '[data-sch-day-index="3"][data-sch-all-day]'
        )!
        await drag(wrapper, leftEdge(wrapper), centre(thu))
        const mutation: Mutation = onMutate.mock.calls[0][0]
        expect(mutation.kind).toBe('resize')
        expect(iso(mutation.after!.end)).toBe('2026-09-11T00:00')
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

import { describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-svelte'
import { Scheduler } from '../../lib/index.js'
import {
    ZONE,
    anchor,
    centre,
    column,
    frame,
    grid,
    pointAt,
    pointer,
    settle,
    tap,
    wait
} from '../fixtures/dom.js'

function mount(props: Record<string, unknown>) {
    const onMutate = vi.fn()
    const screen = render(Scheduler, {
        props: { timeZone: ZONE, date: anchor, events: [], onMutate, ...props }
    })
    screen.container.style.height = '1400px'
    return { ...screen, onMutate }
}

describe('creatable', () => {
    it('shows no ghost and creates nothing when dragging over empty slots', async () => {
        const { container, onMutate } = mount({ creatable: false })
        const wed = column(container, '2026-09-09')
        const target = grid(container)
        target.dispatchEvent(pointer('pointerdown', pointAt(wed, 540)))
        target.dispatchEvent(pointer('pointermove', pointAt(wed, 660)))
        await frame()
        expect(container.querySelector('[data-sch-ghost]')).toBeNull()
        target.dispatchEvent(pointer('pointerup', pointAt(wed, 660)))
        await settle()
        expect(onMutate).not.toHaveBeenCalled()
    })

    it('creates nothing from Enter on a focused slot', async () => {
        const { container, onMutate } = mount({ creatable: false })
        const target = grid(container)
        target.focus()
        target.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
        await settle()
        expect(onMutate).not.toHaveBeenCalled()
    })

    it('still selects a day from a click on a month cell', async () => {
        const { container } = mount({ creatable: false, view: 'month' })
        await wait(60)
        tap(container.querySelector('[data-sch-day="2026-09-22"]')!)
        await settle()
        expect(container.querySelector('[data-sch-anchor]')?.getAttribute('data-sch-day')).toBe(
            '2026-09-22'
        )
    })

    it('creates by dragging when left at its default', async () => {
        const { container, onMutate } = mount({})
        const wed = column(container, '2026-09-09')
        const target = grid(container)
        target.dispatchEvent(pointer('pointerdown', pointAt(wed, 540)))
        target.dispatchEvent(pointer('pointermove', pointAt(wed, 660)))
        await frame()
        expect(container.querySelector('[data-sch-ghost]')?.textContent).toContain('New event')
        target.dispatchEvent(
            pointer('pointerup', centre(container.querySelector('[data-sch-ghost]') ?? wed))
        )
        await settle()
        expect(onMutate).toHaveBeenCalledTimes(1)
    })
})

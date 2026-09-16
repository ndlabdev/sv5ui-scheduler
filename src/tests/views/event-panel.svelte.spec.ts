import { describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-svelte'
import { userEvent } from 'vitest/browser'
import type { Mutation } from '../../lib/types/mutation.types.js'
import EventPanelScheduler from '../fixtures/EventPanelScheduler.svelte'
import { anchor, input, press, tap, wait } from '../fixtures/dom.js'

const settle = () => wait(300)
const events = [
    input('a', '2026-09-09T09:00', '2026-09-09T10:00', { calendarId: 'work' }),
    input('locked', '2026-09-10T09:00', '2026-09-10T10:00', { editable: false }),
    input('standup', '2026-09-07T08:00', '2026-09-07T08:30', {
        recurrence: { freq: 'daily', count: 5 }
    })
]

const chip = (root: Element, id: string) =>
    root.querySelector<HTMLElement>(`[data-sch-event-id="${id}"]`)!
const dialog = () => document.querySelector<HTMLElement>('[role="dialog"]')
const panel = () => document.querySelector<HTMLElement>('[data-sch-event-panel]')
const deleteButton = () =>
    [...(dialog()?.querySelectorAll('button') ?? [])].find((button) =>
        button.textContent?.includes('Delete event')
    )

async function drift(target: HTMLElement, action: () => void) {
    const root = target.closest<HTMLElement>('[data-sch-scheduler]')!
    const offset = () => target.getBoundingClientRect().x - root.getBoundingClientRect().x
    const origin = offset()
    let moved = 0
    let running = true
    const sample = () => {
        moved = Math.max(moved, Math.abs(offset() - origin), Math.abs(root.scrollLeft))
        if (running) requestAnimationFrame(sample)
    }
    requestAnimationFrame(sample)
    action()
    await wait(400)
    running = false
    return moved
}

async function open(container: Element, id: string) {
    tap(chip(container, id))
    await settle()
}

describe('event details in a slide-over', () => {
    it('opens inside the scheduler with the default details instead of a popover', async () => {
        const { container } = render(EventPanelScheduler, { initial: events, date: anchor })
        await wait(60)
        await open(container, 'a')
        expect(document.querySelector('[data-sch-detail]')).toBeNull()
        expect(container.querySelector('[data-sch-scheduler]')!.contains(dialog())).toBe(true)
        expect(panel()?.dataset.schEventPanel).toBe('a')
        expect(panel()?.textContent).toContain('Wednesday, September 9, 2026')
        expect(panel()?.querySelector('[data-sch-detail-calendar]')?.textContent).toContain('Work')
        expect(deleteButton()).toBeDefined()
    })

    it('deletes through the pipeline and closes', async () => {
        const onMutate = vi.fn()
        const screen = render(EventPanelScheduler, { initial: events, date: anchor, onMutate })
        await wait(60)
        await open(screen.container, 'a')
        deleteButton()!.click()
        await settle()
        const mutation: Mutation = onMutate.mock.calls[0][0]
        expect(mutation.kind).toBe('delete')
        expect(mutation.eventId).toBe('a')
        expect(dialog()).toBeNull()
        expect(screen.component.getEvents().map((event) => event.id)).not.toContain('a')
    })

    it('offers no delete for a locked event or a locked calendar', async () => {
        const locked = render(EventPanelScheduler, { initial: events, date: anchor })
        await wait(60)
        await open(locked.container, 'locked')
        expect(panel()?.dataset.schEventPanel).toBe('locked')
        expect(deleteButton()).toBeUndefined()
        locked.unmount()

        const readOnly = render(EventPanelScheduler, {
            initial: events,
            date: anchor,
            editable: false
        })
        await wait(60)
        await open(readOnly.container, 'a')
        expect(panel()?.dataset.schEventPanel).toBe('a')
        expect(deleteButton()).toBeUndefined()
    })

    it('ignores remove from the snippet when the event is locked', async () => {
        const onMutate = vi.fn()
        const { container } = render(EventPanelScheduler, {
            initial: events,
            date: anchor,
            custom: true,
            onMutate
        })
        await wait(60)
        await open(container, 'locked')
        expect(panel()?.querySelector('[data-probe-deletable]')?.textContent).toBe('false')
        panel()!.querySelector<HTMLElement>('[data-probe-remove]')!.click()
        await settle()
        expect(onMutate).not.toHaveBeenCalled()
        expect(panel()?.dataset.schEventPanel).toBe('locked')
    })

    it('closes when the open event is removed from the bound array', async () => {
        const screen = render(EventPanelScheduler, { initial: events, date: anchor })
        await wait(60)
        await open(screen.container, 'a')
        expect(dialog()).not.toBeNull()
        screen.component.removeEvent('a')
        await settle()
        expect(dialog()).toBeNull()
    })

    it.each(['ltr', 'rtl'] as const)(
        'keeps the calendar still while the panel slides in (%s)',
        async (dir) => {
            const { container } = render(EventPanelScheduler, {
                initial: events,
                date: anchor,
                dir
            })
            await wait(60)
            const target = chip(container, 'a')
            const moved = await drift(target, () => tap(target))
            expect(dialog()).not.toBeNull()
            expect(moved).toBe(0)
        }
    )

    it('closes on Escape and opens the next event, occurrences included', async () => {
        const { container } = render(EventPanelScheduler, { initial: events, date: anchor })
        await wait(60)
        await open(container, 'a')
        press(dialog()!, 'Escape')
        await settle()
        expect(dialog()).toBeNull()

        const occurrence = [
            ...container.querySelectorAll<HTMLElement>('[data-sch-event^="standup@"]')
        ].find((element) => element.dataset.schEvent?.includes('2026-09-09'))!
        tap(occurrence.querySelector('[data-sch-event-id]') ?? occurrence)
        await settle()
        expect(panel()?.dataset.schEventPanel).toMatch(/^standup@/)
        expect(panel()?.textContent).toContain('8:00')
    })

    it('lets the eventPanel snippet replace the body', async () => {
        const onMutate = vi.fn()
        const { container } = render(EventPanelScheduler, {
            initial: events,
            date: anchor,
            custom: true,
            onMutate
        })
        await wait(60)
        await open(container, 'a')
        const body = panel()!
        expect(body.querySelector('[data-probe-panel]')?.textContent).toBe('a')
        expect(body.querySelector('[data-probe-deletable]')?.textContent).toBe('true')
        expect(body.querySelector('[data-sch-detail-calendar]')).toBeNull()
        expect(deleteButton()).toBeUndefined()

        body.querySelector<HTMLElement>('[data-probe-close]')!.click()
        await settle()
        expect(dialog()).toBeNull()

        await open(container, 'a')
        panel()!.querySelector<HTMLElement>('[data-probe-remove]')!.click()
        await settle()
        expect(onMutate).toHaveBeenCalledWith(
            expect.objectContaining({ kind: 'delete', eventId: 'a' })
        )
        expect(dialog()).toBeNull()
    })
})

describe('popover actions', () => {
    const tooltip = () => document.querySelector('[data-tooltip-content]')

    it('names every action with a tooltip', async () => {
        const { container } = render(EventPanelScheduler, {
            initial: events,
            date: anchor,
            detail: 'popover',
            custom: true
        })
        await wait(60)
        tap(chip(container, 'a'))
        await settle()
        const detail = document.querySelector<HTMLElement>('[data-sch-detail="a"]')!
        const buttons = [...detail.querySelectorAll<HTMLElement>('button')]
        expect(buttons.map((button) => button.getAttribute('aria-label'))).toEqual([
            'Open details',
            'Delete event',
            'Close'
        ])
        for (const button of buttons) {
            await userEvent.hover(button)
            await expect
                .poll(() => tooltip()?.textContent?.trim(), { timeout: 2000 })
                .toBe(button.getAttribute('aria-label'))
            await userEvent.unhover(button)
            await expect.poll(() => tooltip(), { timeout: 2000 }).toBeNull()
        }
    })

    it('shows no tooltip from the focus the popover places on its first action', async () => {
        const { container } = render(EventPanelScheduler, {
            initial: events,
            date: anchor,
            detail: 'popover',
            custom: true
        })
        await wait(60)
        await userEvent.click(chip(container, 'a'))
        await wait(900)
        expect(document.querySelector('[data-sch-detail="a"]')).not.toBeNull()
        expect(document.activeElement?.closest('[data-sch-detail="a"]')).not.toBeNull()
        expect(tooltip()).toBeNull()
        await userEvent.keyboard('{Tab}')
        await userEvent.keyboard('{Tab}')
        await expect
            .poll(() => tooltip()?.textContent?.trim(), { timeout: 2000 })
            .toBe('Delete event')
    })

    it('offers the open button only when a panel exists, and swaps the popover for it', async () => {
        const plain = render(EventPanelScheduler, {
            initial: events,
            date: anchor,
            detail: 'popover'
        })
        await wait(60)
        tap(chip(plain.container, 'a'))
        await settle()
        expect(document.querySelector('[data-sch-detail="a"] [data-sch-detail-open]')).toBeNull()
        press(document.querySelector('[data-sch-detail="a"]')!, 'Escape')
        plain.unmount()
        await settle()

        const withPanel = render(EventPanelScheduler, {
            initial: events,
            date: anchor,
            detail: 'popover',
            custom: true
        })
        await wait(60)
        tap(chip(withPanel.container, 'a'))
        await settle()
        expect(panel()).toBeNull()
        document.querySelector<HTMLElement>('[data-sch-detail="a"] [data-sch-detail-open]')!.click()
        await settle()
        expect(document.querySelector('[data-sch-detail="a"]')).toBeNull()
        expect(panel()?.dataset.schEventPanel).toBe('a')
        expect(panel()?.querySelector('[data-probe-panel]')?.textContent).toBe('a')
    })
})

describe('editing from the panel', () => {
    const rename = () => (document.querySelector('[data-probe-rename]') as HTMLElement).click()

    it('sends an update through the pipeline and writes it back', async () => {
        const seen: Mutation[] = []
        const screen = render(EventPanelScheduler, {
            initial: events,
            date: anchor,
            custom: true,
            onMutate: async (mutation: Mutation) => void seen.push(mutation)
        })
        await wait(60)
        await open(screen.container, 'a')
        rename()
        await settle()
        expect(seen.map((mutation) => mutation.kind)).toEqual(['update'])
        expect(seen[0].after?.title).toBe('Renamed')
        expect(seen[0].before?.title).toBe('a')
        expect(screen.component.getEvents().find((event) => event.id === 'a')?.title).toBe(
            'Renamed'
        )
        expect(panel()?.textContent).toContain('Renamed')
    })

    it('rolls the update back when the save fails', async () => {
        const screen = render(EventPanelScheduler, {
            initial: events,
            date: anchor,
            custom: true,
            onMutate: async () => {
                throw new Error('offline')
            }
        })
        await wait(60)
        await open(screen.container, 'a')
        rename()
        await wait(600)
        expect(screen.component.getEvents().find((event) => event.id === 'a')?.title).toBe('a')
    })

    it('ignores an update to an event that may not be edited', async () => {
        const onMutate = vi.fn()
        const screen = render(EventPanelScheduler, {
            initial: events,
            date: anchor,
            custom: true,
            onMutate
        })
        await wait(60)
        await open(screen.container, 'locked')
        rename()
        await settle()
        expect(onMutate).not.toHaveBeenCalled()
        expect(screen.component.getEvents().find((event) => event.id === 'locked')?.title).toBe(
            'locked'
        )
    })
})

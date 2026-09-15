import { describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-svelte'
import type { EventInput } from '../../lib/types/event.types.js'
import type { Mutation } from '../../lib/types/mutation.types.js'
import ApiScheduler from '../fixtures/ApiScheduler.svelte'
import { anchor, centre, column, drag, grid, iso, pointAt, settle, wait } from '../fixtures/dom.js'

const chips = (root: Element) =>
    [...root.querySelectorAll<HTMLElement>('[data-sch-event]')].map((chip) => chip.dataset.schEvent)

function serverEvent(overrides: Partial<EventInput> = {}): EventInput {
    return {
        id: 'srv-1',
        title: 'From the API',
        start: '2026-09-09T02:00:00Z',
        end: '2026-09-09T03:30:00Z',
        ...overrides
    }
}

describe('events that arrive from an API', () => {
    it('renders a list assigned after mount and reads UTC and offset timestamps in the zone', async () => {
        const screen = render(ApiScheduler, { date: anchor })
        await settle()
        expect(chips(screen.container)).toEqual([])

        screen.component.load([
            serverEvent(),
            serverEvent({
                id: 'srv-2',
                title: 'Offset',
                start: '2026-09-10T16:00:00+07:00',
                end: '2026-09-10T17:00:00+07:00'
            })
        ])
        await settle()
        expect(chips(screen.container)).toEqual(['srv-1', 'srv-2'])
        const first = screen.container.querySelector('[data-sch-event="srv-1"]')!
        expect(first.textContent).toContain('9:00')
        const second = screen.container.querySelector('[data-sch-event="srv-2"]')!
        expect(second.textContent).toContain('4:00')
        expect(screen.component.getEvents()[0].start).toBe('2026-09-09T02:00:00Z')
    })

    it('replaces a client id with the id the server assigns on create', async () => {
        const onMutate = vi.fn(async (mutation: Mutation) => {
            await wait(30)
            return { ...mutation.after!, id: 'srv-9' }
        })
        const screen = render(ApiScheduler, { date: anchor, onMutate })
        await settle()
        const wed = column(screen.container, '2026-09-09')
        await drag(grid(screen.container), pointAt(wed, 540), pointAt(wed, 600))
        await wait(120)
        expect(chips(screen.container)).toEqual(['srv-9'])
        expect(screen.component.getEvents().map((event) => event.id)).toEqual(['srv-9'])
    })

    it('keeps a move that the server confirmed even when the app refetches the old list meanwhile', async () => {
        const list = [serverEvent()]
        let release: () => void = () => {}
        const onMutate = vi.fn(async (mutation: Mutation) => {
            await new Promise<void>((resolve) => (release = resolve))
            return mutation.after!
        })
        const screen = render(ApiScheduler, { date: anchor, onMutate })
        screen.component.load(list)
        await settle()
        const chip = screen.container.querySelector<HTMLElement>('[data-sch-event="srv-1"]')!
        const from = centre(chip)
        await drag(chip, from, { clientX: from.clientX, clientY: from.clientY + 96 })
        expect(iso(onMutate.mock.calls[0][0].after!.start)).toBe('2026-09-09T11:00')

        screen.component.load([...list])
        await settle()
        release()
        await wait(120)
        const written = screen.component.getEvents()[0].start as unknown as { hour: number }
        expect(written.hour).toBe(11)
        const moved = screen.container.querySelector<HTMLElement>('[data-sch-event="srv-1"]')!
        expect(moved.textContent).toContain('11:00')
    })

    it('rolls a failed delete back into the bound array and reports the error', async () => {
        const onError = vi.fn()
        const onMutate = vi.fn(async () => {
            await wait(30)
            throw new Error('403')
        })
        const screen = render(ApiScheduler, { date: anchor, onMutate, onError })
        screen.component.load([serverEvent()])
        await settle()
        const chip = screen.container.querySelector<HTMLElement>('[data-sch-event-id="srv-1"]')!
        chip.click()
        await settle()
        document
            .querySelector<HTMLElement>(
                '[data-sch-detail="srv-1"] button[aria-label="Delete event"]'
            )!
            .click()
        await wait(200)
        expect(onError).toHaveBeenCalledTimes(1)
        expect(chips(screen.container)).toEqual(['srv-1'])
        expect(screen.component.getEvents().map((event) => event.id)).toEqual(['srv-1'])
    })

    it('drops events the server no longer returns and adds new ones on refetch', async () => {
        const screen = render(ApiScheduler, { date: anchor })
        screen.component.load([serverEvent(), serverEvent({ id: 'srv-2', title: 'Two' })])
        await settle()
        screen.component.load([
            serverEvent({ id: 'srv-2', title: 'Two' }),
            serverEvent({ id: 'srv-3', title: 'Three' })
        ])
        await settle()
        expect(chips(screen.container)).toEqual(['srv-2', 'srv-3'])
    })
})

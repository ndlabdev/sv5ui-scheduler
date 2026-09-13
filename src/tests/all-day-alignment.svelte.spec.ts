import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-svelte'
import { Scheduler } from '../lib/index.js'
import { ZONE, anchor, input, wait } from './fixtures/dom.js'

const events = [
    input('offsite', '2026-09-10', '2026-09-12', { allDay: true }),
    input('birthday', '2026-09-12', '2026-09-13', { allDay: true }),
    input('monday', '2026-09-07', '2026-09-08', { allDay: true })
]

function cell(root: Element, index: number) {
    return root
        .querySelector<HTMLElement>(`[data-sch-day-index="${index}"][data-sch-all-day]`)!
        .getBoundingClientRect()
}

function measure(root: Element, id: string, first: number, last: number) {
    const wrapper = root.querySelector<HTMLElement>(`[data-sch-event="${id}"]`)!
    const chip = wrapper.querySelector<HTMLElement>('[data-sch-event-id]')!.getBoundingClientRect()
    const start = cell(root, first)
    const end = cell(root, last)
    const left = Math.min(start.left, end.left)
    const right = Math.max(start.right, end.right)
    return { startGap: chip.left - left, endGap: right - chip.right }
}

describe('all-day row alignment', () => {
    for (const dir of ['ltr', 'rtl'] as const) {
        it(`keeps every chip inside the columns it covers with even gaps (${dir})`, async () => {
            const { container } = render(Scheduler, {
                props: { timeZone: ZONE, date: anchor, events, dir, weekStartsOn: 1 }
            })
            container.style.width = '1000px'
            container.style.height = '700px'
            await wait(60)
            for (const [id, first, last] of [
                ['monday', 0, 0],
                ['offsite', 3, 4],
                ['birthday', 5, 5]
            ] as const) {
                const { startGap, endGap } = measure(container, id, first, last)
                expect(startGap, `${id} start gap`).toBeGreaterThanOrEqual(0)
                expect(endGap, `${id} end gap`).toBeGreaterThanOrEqual(0)
                expect(Math.abs(startGap - endGap), `${id} uneven gaps`).toBeLessThan(1)
            }
        })
    }

    it('keeps month chips inside their cells with even gaps', async () => {
        const { container } = render(Scheduler, {
            props: { timeZone: ZONE, date: anchor, events, view: 'month', weekStartsOn: 1 }
        })
        container.style.width = '1000px'
        container.style.height = '800px'
        await wait(60)
        for (const [id, first, last] of [
            ['monday', 7, 7],
            ['offsite', 10, 11],
            ['birthday', 12, 12]
        ] as const) {
            const { startGap, endGap } = measure(container, id, first, last)
            expect(startGap, `${id} start gap`).toBeGreaterThanOrEqual(0)
            expect(endGap, `${id} end gap`).toBeGreaterThanOrEqual(0)
            expect(Math.abs(startGap - endGap), `${id} uneven gaps`).toBeLessThan(1)
        }
    })
})

import { createRawSnippet } from 'svelte'
import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-svelte'
import { Scheduler } from '../../lib/index.js'
import { ZONE, anchor, input, wait } from '../fixtures/dom.js'

function mount(props: Record<string, unknown>, width: number, height: number) {
    const screen = render(Scheduler, { props: { timeZone: ZONE, date: anchor, ...props } })
    screen.container.style.width = `${width}px`
    screen.container.style.height = `${height}px`
    return screen
}

const layout = () => wait(80)

const weekdays = (container: Element) =>
    [...container.querySelectorAll('[data-sch-month-grid] > :first-child > *')].map((cell) =>
        cell.textContent?.trim()
    )

describe('month grid in small containers', () => {
    it('uses short weekday names when the grid is narrow', async () => {
        const narrow = mount({ view: 'month', events: [] }, 520, 600)
        const wide = mount({ view: 'month', events: [] }, 1200, 600)
        await layout()
        expect(weekdays(narrow.container)[0]).toBe('Mon')
        expect(weekdays(wide.container)[0]).toBe('Monday')
    })

    it('drops pill times before titles when the grid is narrow', async () => {
        const events = [input('late', '2026-09-09T09:00', '2026-09-09T10:00')]
        const narrow = mount({ view: 'month', events }, 520, 700)
        const wide = mount({ view: 'month', events }, 1200, 700)
        await layout()
        const chip = (container: Element) =>
            container.querySelector('[data-sch-month-grid] [data-sch-event-id="late"]')
        expect(chip(narrow.container)?.textContent).toContain('late')
        expect(chip(narrow.container)?.textContent).not.toContain('9:00')
        expect(chip(wide.container)?.textContent).toContain('9:00')
    })

    it('keeps rows tall enough for the day number and one lane', async () => {
        const events = [input('late', '2026-09-09T09:00', '2026-09-09T10:00')]
        const { container } = mount({ view: 'month', events }, 1000, 320)
        await layout()
        const cells = [...container.querySelectorAll<HTMLElement>('[data-sch-day-cell]')]
        expect(cells.every((cell) => cell.getBoundingClientRect().height >= 62)).toBe(true)
        const cell = container.querySelector('[data-sch-day="2026-09-09"]')!.getBoundingClientRect()
        const chip = container
            .querySelector('[data-sch-month-grid] [data-sch-event="late"]')!
            .getBoundingClientRect()
        expect(chip.top).toBeGreaterThanOrEqual(cell.top + 29)
    })
})

describe('time grid and agenda text', () => {
    it('fits the title of a fifteen minute event inside its chip', async () => {
        const events = [input('short', '2026-09-09T09:00', '2026-09-09T09:15')]
        const { container } = mount({ events }, 1000, 900)
        await layout()
        const chip = container.querySelector<HTMLElement>('[data-sch-event-id="short"]')!
        const title = [...chip.querySelectorAll<HTMLElement>('span')].find((span) =>
            span.textContent?.includes('short')
        )!
        const line = parseFloat(getComputedStyle(title).lineHeight)
        const box = title.getBoundingClientRect()
        expect(box.height).toBeGreaterThanOrEqual(line - 0.5)
        expect(line).toBeGreaterThanOrEqual(parseFloat(getComputedStyle(title).fontSize) * 1.15)
        expect(box.bottom).toBeLessThanOrEqual(chip.getBoundingClientRect().bottom + 0.5)
    })

    it('keeps agenda times on one line with a twelve hour clock', async () => {
        const events = [input('kickoff', '2026-09-09T10:00', '2026-09-09T11:30')]
        const { container } = mount({ view: 'agenda', events }, 1000, 700)
        await layout()
        const time = container.querySelector('[data-sch-event-id="kickoff"] > span')!
        for (const line of time.querySelectorAll<HTMLElement>(':scope > span')) {
            const height = line.getBoundingClientRect().height
            expect(height).toBeLessThanOrEqual(parseFloat(getComputedStyle(line).lineHeight) + 1)
        }
    })

    it('leaves a custom empty state without the default pill', async () => {
        const empty = createRawSnippet(() => ({
            render: () => '<div class="custom-empty">Nothing planned</div>'
        }))
        const { container } = mount({ events: [], empty }, 1000, 800)
        await layout()
        const wrapper = container.querySelector<HTMLElement>('[data-sch-empty]')!
        expect(wrapper.querySelector('.custom-empty')).not.toBeNull()
        expect(getComputedStyle(wrapper).backgroundColor).toBe('rgba(0, 0, 0, 0)')
        expect(getComputedStyle(wrapper).whiteSpace).not.toBe('nowrap')
        expect(getComputedStyle(wrapper).overflow).toBe('visible')
    })
})

describe('narrow and right to left month grids', () => {
    it('shortens weekday names in Arabic, where short and long names match', async () => {
        const { container } = mount(
            { view: 'month', events: [], locale: 'ar-EG', dir: 'rtl' },
            520,
            600
        )
        await layout()
        const names = weekdays(container)
        expect(new Set(names).size).toBe(7)
        expect(names.every((name) => (name ?? '').length <= 2)).toBe(true)
    })

    it('keeps the overflow button clear of the day number in a very narrow grid', async () => {
        const events = ['a', 'b', 'c', 'd'].map((id, index) =>
            input(id, `2026-09-16T0${index + 1}:00`, `2026-09-16T0${index + 1}:30`)
        )
        const { container } = mount({ view: 'month', events }, 360, 640)
        await layout()
        const cell = container.querySelector<HTMLElement>('[data-sch-day="2026-09-16"]')!
        const more = cell.querySelector<HTMLElement>('[data-sch-more]')!.getBoundingClientRect()
        const number = cell.querySelector<HTMLElement>('span')!.getBoundingClientRect()
        const bounds = cell.getBoundingClientRect()
        const apart =
            more.left >= number.right - 0.5 ||
            more.right <= number.left + 0.5 ||
            more.top >= number.bottom - 0.5
        expect(apart).toBe(true)
        expect(more.bottom).toBeLessThanOrEqual(bounds.bottom + 0.5)
    })

    it('lets each title keep its own direction so it is cut at its own end', async () => {
        const events = [
            input('late', '2026-09-09T09:00', '2026-09-09T10:00'),
            input('meeting', '2026-09-10T09:00', '2026-09-10T10:00', { title: 'اجتماع الفريق' })
        ]
        const { container } = mount(
            { view: 'month', events, locale: 'ar-EG', dir: 'rtl' },
            520,
            700
        )
        await layout()
        const title = (id: string, text: string) =>
            [
                ...container.querySelectorAll<HTMLElement>(
                    `[data-sch-month-grid] [data-sch-event-id="${id}"] span`
                )
            ].find((span) => span.textContent?.trim() === text)!
        expect(getComputedStyle(title('late', 'late')).direction).toBe('ltr')
        expect(getComputedStyle(title('meeting', 'اجتماع الفريق')).direction).toBe('rtl')
    })
})

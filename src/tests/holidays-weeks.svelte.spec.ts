import { createRawSnippet } from 'svelte'
import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-svelte'
import { Scheduler } from '../lib/index.js'
import { vi as viLabels } from '../lib/locales.js'
import type { CellSnippetProps, HeaderSnippetProps } from '../lib/types/snippet.types.js'
import { ZONE, anchor, column, input } from './fixtures/dom.js'

const holidays = [{ date: '2026-09-10', title: 'Mid-Autumn' }, { date: '2026-09-11' }]
const base = { timeZone: ZONE, date: anchor, holidays, weekStartsOn: 1 as const }
const header = (container: Element, day: string) =>
    container.querySelector<HTMLElement>(`[data-sch-day="${day}"]:not([data-sch-day-index])`)!
const background = (element: Element) => getComputedStyle(element).backgroundColor
const weekNumbers = (root: ParentNode) =>
    [...root.querySelectorAll<HTMLElement>('[data-sch-week-number]')].map((element) =>
        Number(element.dataset.schWeekNumber)
    )

describe('holidays', () => {
    it('tints the holiday column and titles its header in the week view', () => {
        const { container } = render(Scheduler, { props: base })
        expect(header(container, '2026-09-10').textContent).toContain('Mid-Autumn')
        expect(header(container, '2026-09-11').querySelector('[data-sch-holiday-title]')).toBeNull()
        expect(background(column(container, '2026-09-10'))).not.toBe(
            background(column(container, '2026-09-08'))
        )
        expect(background(column(container, '2026-09-11'))).toBe(
            background(column(container, '2026-09-10'))
        )
    })

    it('treats a holiday as outside business hours', () => {
        const seen = new Map<string, boolean>()
        const cell = createRawSnippet((props: () => CellSnippetProps) => {
            seen.set(props().date.toString().slice(0, 10), props().isBusinessHours)
            return { render: () => '<i></i>' }
        })
        const { container } = render(Scheduler, {
            props: {
                ...base,
                cell,
                businessHours: { start: '09:00', end: '17:00', days: [1, 2, 3, 4, 5] }
            }
        })
        expect(seen.get('2026-09-09')).toBe(true)
        expect(seen.get('2026-09-10')).toBe(false)
        const blocks = (day: string) =>
            column(container, day).querySelectorAll('[data-sch-off-hours]').length
        expect(blocks('2026-09-09')).toBe(2)
        expect(blocks('2026-09-10')).toBe(0)
    })

    it('passes the holiday to a custom header', () => {
        const headerSnippet = createRawSnippet((props: () => HeaderSnippetProps) => ({
            render: () => `<b data-probe>${props().holiday?.title ?? '-'}</b>`
        }))
        const { container } = render(Scheduler, { props: { ...base, header: headerSnippet } })
        const probes = [...container.querySelectorAll('[data-probe]')].map((b) => b.textContent)
        expect(probes).toEqual(['-', '-', '-', 'Mid-Autumn', '-', '-', '-'])
    })

    it('titles the day view', () => {
        const { container } = render(Scheduler, {
            props: { ...base, view: 'day', date: anchor.add({ days: 1 }) }
        })
        expect(container.querySelector('[data-sch-day-title]')?.textContent).toContain('Mid-Autumn')
    })

    it('tints, titles and names the holiday cell in the month view', () => {
        const { container } = render(Scheduler, { props: { ...base, view: 'month' } })
        const cell = container.querySelector<HTMLElement>('[data-sch-day="2026-09-10"]')!
        const plain = container.querySelector<HTMLElement>('[data-sch-day="2026-09-09"]')!
        expect(cell.querySelector('[data-sch-holiday-title]')?.textContent?.trim()).toBe(
            'Mid-Autumn'
        )
        expect(cell.getAttribute('aria-label')).toMatch(/Mid-Autumn, no events$/)
        expect(plain.getAttribute('aria-label')).not.toContain('Mid-Autumn')
        expect(background(cell)).not.toBe(background(plain))
    })

    it('marks holidays in the year view', () => {
        const { container } = render(Scheduler, { props: { ...base, view: 'year' } })
        const marked = [...container.querySelectorAll('[data-sch-holiday]')].map((d) =>
            d.getAttribute('data-sch-day')
        )
        expect(marked).toEqual(['2026-09-10', '2026-09-11'])
        const day = container.querySelector('button[data-sch-day="2026-09-10"]')!
        expect(day.getAttribute('aria-label')).toMatch(/, Mid-Autumn$/)
    })

    it('titles the agenda day heading', () => {
        const { container } = render(Scheduler, {
            props: {
                ...base,
                view: 'agenda',
                events: [input('a', '2026-09-10T09:00', '2026-09-10T10:00')]
            }
        })
        const group = container.querySelector('li[data-sch-day="2026-09-10"] > div')!
        expect(group.textContent).toContain('Mid-Autumn')
    })
})

describe('week numbers', () => {
    it('stays hidden unless asked for', () => {
        for (const view of ['week', 'day', 'month', 'year']) {
            const { container, unmount } = render(Scheduler, { props: { ...base, view } })
            expect(weekNumbers(container)).toEqual([])
            unmount()
        }
    })

    it('labels the week view with its ISO week', () => {
        const { container } = render(Scheduler, { props: { ...base, weekNumbers: true } })
        expect(weekNumbers(container)).toEqual([37])
        const label = container.querySelector('[data-sch-week-number]')!
        expect(label.querySelector('[aria-hidden="true"]')?.textContent).toBe('W37')
        expect(label.querySelector('.sr-only')?.textContent).toBe('Week 37')
    })

    it('labels the day view with the week of that day', () => {
        const { container } = render(Scheduler, {
            props: { ...base, view: 'day', date: anchor.add({ days: 5 }), weekNumbers: true }
        })
        expect(weekNumbers(container)).toEqual([38])
    })

    it('numbers every month row, whichever day starts the week', () => {
        const monday = render(Scheduler, { props: { ...base, view: 'month', weekNumbers: true } })
        expect(weekNumbers(monday.container)).toEqual([36, 37, 38, 39, 40])
        monday.unmount()

        const sunday = render(Scheduler, {
            props: { ...base, view: 'month', weekNumbers: true, weekStartsOn: 0 }
        })
        expect(weekNumbers(sunday.container)).toEqual([36, 37, 38, 39, 40])
    })

    it('numbers the weeks of every mini month in the year view, across the year boundary', () => {
        const { container } = render(Scheduler, {
            props: { ...base, view: 'year', weekNumbers: true }
        })
        const month = (n: number) => container.querySelector(`[data-sch-month="${n}"]`)!
        expect(weekNumbers(month(1))).toEqual([1, 2, 3, 4, 5])
        expect(weekNumbers(month(9))).toEqual([36, 37, 38, 39, 40])
        expect(weekNumbers(month(12))).toEqual([49, 50, 51, 52, 53])
        const days = month(9).querySelector<HTMLElement>('[data-sch-day="2026-09-01"]')!
        expect(days.parentElement!.children[0].hasAttribute('data-sch-week-number')).toBe(true)
    })

    it('uses the scheduler labels', () => {
        const { container } = render(Scheduler, {
            props: { ...base, weekNumbers: true, labels: viLabels, locale: 'vi-VN' }
        })
        const label = container.querySelector('[data-sch-week-number]')!
        expect(label.querySelector('[aria-hidden="true"]')?.textContent).toBe('T37')
        expect(label.querySelector('.sr-only')?.textContent).toBe('Tuần 37')
    })
})

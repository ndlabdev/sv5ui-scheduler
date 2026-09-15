import { parseZonedDateTime } from '@internationalized/date'
import { tap, wait } from '../fixtures/dom.js'
import { createRawSnippet } from 'svelte'
import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-svelte'
import { Scheduler } from '../../lib/index.js'
import { en } from '../../lib/locales/index.js'
import type { EventInput } from '../../lib/types/event.types.js'
import type { SchedulerLabels } from '../../lib/types/labels.types.js'

const MARK = 'qx'
const ZONE = 'Asia/Tokyo'
const anchor = parseZonedDateTime('2026-09-09T12:00[Asia/Tokyo]')
const settle = () => wait(60)
const ATTRIBUTES = [
    'aria-label',
    'aria-description',
    'aria-roledescription',
    'title',
    'placeholder',
    'alt'
]

function pseudo<T extends object>(source: T): T {
    return Object.fromEntries(
        Object.entries(source).map(([key, value]) => {
            if (typeof value === 'string') return [key, `${MARK}${key}`]
            if (typeof value === 'function') {
                return [
                    key,
                    (...args: unknown[]) =>
                        [`${MARK}${key}`, ...args.filter((arg) => typeof arg !== 'object')].join(
                            ' '
                        )
                ]
            }
            return [key, pseudo(value as object)]
        })
    ) as T
}

const labels = pseudo(en) satisfies SchedulerLabels
const input = (
    id: string,
    start: string,
    end: string,
    extra: Partial<EventInput> = {}
): EventInput => ({ id, title: `${MARK}${id}`, start, end, ...extra })

const events = [
    input('standup', '2026-09-09T09:00', '2026-09-09T09:30'),
    input('review', '2026-09-09T09:00', '2026-09-09T11:00'),
    input('trip', '2026-09-08', '2026-09-11', { allDay: true }),
    input('late', '2026-09-10T22:00', '2026-09-11T01:00'),
    ...Array.from({ length: 6 }, (_, i) =>
        input(`busy${i}`, '2026-09-15T08:00', '2026-09-15T09:00')
    )
]

function strings(root: Element): string[] {
    const found: string[] = []
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const parent = node.parentElement
        if (parent?.closest('style, script, [data-sch-zone]')) continue
        found.push(node.textContent ?? '')
    }
    for (const element of root.querySelectorAll('*')) {
        if (element.matches('[data-sch-zone]')) continue
        for (const name of ATTRIBUTES) {
            const value = element.getAttribute(name)
            if (value) found.push(value)
        }
    }
    return found
}

function leaks(root: Element): string[] {
    const words = strings(root).flatMap((text) => text.split(/[\s,.;:()[\]/+–-]+/))
    return [...new Set(words.filter((word) => /[A-Za-z]{2,}/.test(word) && !word.includes(MARK)))]
}

function mount(view: string) {
    const actions = createRawSnippet(() => ({ render: () => '<span></span>' }))
    const screen = render(Scheduler, {
        props: {
            view,
            events,
            labels,
            locale: 'ja-JP',
            timeZone: ZONE,
            date: anchor,
            holidays: [{ date: '2026-09-10', title: `${MARK}holiday` }],
            businessHours: { start: '09:00', end: '17:00', days: [1, 2, 3, 4, 5] },
            weekNumbers: true,
            onMenu: () => {},
            toolbarActions: actions
        }
    })
    screen.container.style.height = '720px'
    return screen
}

describe('every displayed string comes from labels, Intl or the data', () => {
    it.each(['week', 'day', 'month', 'year', 'agenda'])('the %s view', async (view) => {
        const { container } = mount(view)
        await settle()
        expect(leaks(container)).toEqual([])
    })

    it('the empty week', async () => {
        const { container } = mount('week')
        container.querySelector<HTMLElement>('button[aria-label="qxnext"]')!.click()
        container.querySelector<HTMLElement>('button[aria-label="qxnext"]')!.click()
        await settle()
        expect(container.textContent).toContain('qxnoEvents')
        expect(leaks(container)).toEqual([])
    })

    it('an open event popover', async () => {
        const { container } = mount('week')
        tap(container.querySelector('[data-sch-event-id="review"]')!)
        await settle()
        const detail = document.querySelector('[data-sch-detail="review"]')
        expect(detail).not.toBeNull()
        expect(leaks(detail!.closest('[role="dialog"]') ?? detail!)).toEqual([])
    })

    it('an open overflow list', async () => {
        const { container } = mount('month')
        tap(container.querySelector('[data-sch-more="2026-09-15"]')!)
        await settle()
        const list = document.querySelector('[data-sch-more-list="2026-09-15"]')
        expect(list).not.toBeNull()
        expect(leaks(list!.parentElement!)).toEqual([])
    })

    it('the live region', async () => {
        const { container } = mount('week')
        const grid = container.querySelector<HTMLElement>('[role="application"]')!
        grid.focus()
        grid.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }))
        await settle()
        const live = container.querySelector('[aria-live="polite"][aria-atomic]')!
        expect(live.textContent?.trim()).not.toBe('')
        expect(leaks(live)).toEqual([])
    })

    it('catches an English string that bypasses labels', () => {
        const probe = document.createElement('div')
        probe.innerHTML = '<span>qxtoday</span><button aria-label="Close"></button>'
        expect(leaks(probe)).toEqual(['Close'])
    })
})

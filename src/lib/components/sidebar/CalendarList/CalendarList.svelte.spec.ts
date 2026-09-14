import { createRawSnippet } from 'svelte'
import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-svelte'
import { vi as viLabels } from '../../../locales/index.js'
import CalendarList from './CalendarList.svelte'
import type { CalendarListItemProps } from './calendar-list.types.js'

const calendars = [
    { id: 'work', title: 'Work', color: 'info' as const },
    { id: 'plain', title: 'Plain' }
]

describe('CalendarList', () => {
    it('renders a titled checklist with one swatch per calendar', () => {
        const { container } = render(CalendarList, {
            props: { calendars, hiddenCalendars: ['plain'] }
        })
        expect(container.querySelector('h3')?.textContent).toBe('My calendars')
        const section = container.querySelector('section')!
        expect(section.getAttribute('aria-labelledby')).toBe(container.querySelector('h3')!.id)
        const boxes = [...container.querySelectorAll('[role="checkbox"]')]
        expect(boxes.map((box) => box.getAttribute('aria-checked'))).toEqual(['true', 'false'])
        const swatches = [...container.querySelectorAll('li span:nth-of-type(1)')].map(
            (swatch) => swatch.className
        )
        expect(swatches.some((name) => name.includes('bg-info'))).toBe(true)
        expect(swatches.some((name) => name.includes('bg-primary'))).toBe(true)
    })

    it('uses the given labels and hides the heading when the title is null', () => {
        const translated = render(CalendarList, { props: { calendars, labels: viLabels } })
        expect(translated.container.querySelector('h3')?.textContent).toBe('Lịch của tôi')
        translated.unmount()
        const bare = render(CalendarList, { props: { calendars, title: null } })
        expect(bare.container.querySelector('h3')).toBeNull()
        expect(bare.container.querySelector('section')?.hasAttribute('aria-labelledby')).toBe(false)
    })

    it('hands each row to a custom item snippet with a working toggle', async () => {
        const toggles: (() => void)[] = []
        const item = createRawSnippet((props: () => CalendarListItemProps) => {
            toggles.push(props().toggle)
            return {
                render: () => `<b data-probe>${props().calendar.title}</b>`
            }
        })
        const { container } = render(CalendarList, { props: { calendars, item } })
        expect([...container.querySelectorAll('[data-probe]')].map((b) => b.textContent)).toEqual([
            'Work',
            'Plain'
        ])
        expect(container.querySelector('[role="checkbox"]')).toBeNull()
        expect(toggles).toHaveLength(2)
    })
})

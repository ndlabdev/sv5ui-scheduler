import { createRawSnippet } from 'svelte'
import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-svelte'
import { vi as viLabels } from '../../../locales/index.js'
import DragSourceList from './DragSourceList.svelte'
import type { DragSourceListItemProps } from './drag-source-list.types.js'

const items = [
    { id: 'a', title: 'Short', durationMinutes: 45 },
    { id: 'b', title: 'Long', durationMinutes: 120, calendarId: 'home' },
    { id: 'c', title: 'Own', calendarId: 'home', color: 'error' as const }
]
const calendars = [{ id: 'home', title: 'Home', color: 'success' as const }]

describe('DragSourceList', () => {
    it('lists items with translated durations and a grab affordance', () => {
        const { container } = render(DragSourceList, {
            props: { items, calendars, labels: viLabels }
        })
        expect(container.querySelector('h3')?.textContent).toBe('Chưa xếp lịch')
        const rows = [...container.querySelectorAll<HTMLElement>('li button')]
        expect(rows.map((row) => row.textContent?.replace(/\s+/g, ' ').trim())).toEqual([
            'Short 45 phút',
            'Long 2 giờ',
            'Own'
        ])
        expect(getComputedStyle(rows[0]).cursor).toBe('grab')
    })

    it('colours by the item, then its calendar, then primary', () => {
        const { container } = render(DragSourceList, { props: { items, calendars } })
        const swatches = [...container.querySelectorAll('li button')].map(
            (row) => row.querySelector('span')!.className
        )
        expect(swatches[0]).toContain('bg-primary')
        expect(swatches[1]).toContain('bg-success')
        expect(swatches[2]).toContain('bg-error')
    })

    it('renders a custom item snippet inside the draggable button', () => {
        const item = createRawSnippet((props: () => DragSourceListItemProps) => ({
            render: () => `<b data-probe>${props().item.title}:${props().color}</b>`
        }))
        const { container } = render(DragSourceList, {
            props: { items, calendars, item, title: null }
        })
        expect(container.querySelector('h3')).toBeNull()
        expect(
            [...container.querySelectorAll('button [data-probe]')].map((b) => b.textContent)
        ).toEqual(['Short:primary', 'Long:success', 'Own:error'])
    })
})

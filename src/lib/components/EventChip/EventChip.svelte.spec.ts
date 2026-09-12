import { parseZonedDateTime } from '@internationalized/date'
import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-svelte'
import type { SchedulerEvent } from '../../types/event.types.js'
import type { SpanPosition } from '../../types/extension.types.js'
import EventChip from './EventChip.svelte'

const at = (iso: string) => parseZonedDateTime(`${iso}[Asia/Ho_Chi_Minh]`)
const event = (extra: Partial<SchedulerEvent> = {}): SchedulerEvent => ({
    id: 'a',
    title: 'Standup',
    start: at('2026-09-12T09:00'),
    end: at('2026-09-12T09:30'),
    ...extra
})
const root = (container: Element) => container.querySelector('button') as HTMLButtonElement

describe('EventChip', () => {
    it('renders the title and the time range', () => {
        const { container } = render(EventChip, { event: event() })
        expect(root(container).textContent).toContain('Standup')
        expect(root(container).textContent).toContain('9:00')
        expect(root(container).textContent).toContain('9:30')
    })

    it('hides the time for all-day events', () => {
        const { container } = render(EventChip, { event: event({ allDay: true }) })
        expect(root(container).textContent?.trim()).toBe('Standup')
    })

    it('hides the time when placed as a span', () => {
        const position: SpanPosition = {
            kind: 'span',
            event: event(),
            row: 0,
            lane: 0,
            startColumn: 1,
            endColumn: 3,
            continuesBefore: true,
            continuesAfter: false
        }
        const { container } = render(EventChip, { event: event(), position })
        expect(root(container).textContent?.trim()).toBe('Standup')
        expect(root(container).className).toContain('rounded-l-none')
    })

    it('uses the event colour unless overridden', () => {
        const themed = render(EventChip, { event: event({ color: 'success' }) })
        expect(root(themed.container).className).toContain('bg-success-container')
        const forced = render(EventChip, { event: event({ color: 'success' }), color: 'error' })
        expect(root(forced.container).className).toContain('bg-error-container')
    })

    it('exposes selection to assistive tech and carries the event id', () => {
        const { container } = render(EventChip, { event: event(), selected: true })
        expect(root(container).getAttribute('aria-pressed')).toBe('true')
        expect(root(container).dataset.schEventId).toBe('a')
    })

    it('formats the time in the given locale', () => {
        const { container } = render(EventChip, { event: event(), locale: 'vi-VN' })
        expect(root(container).textContent).toContain('09:00')
    })
})

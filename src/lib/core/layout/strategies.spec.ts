import { describe, expect, it } from 'vitest'
import { contextFor, event, week } from './fixtures.js'
import { builtinLayouts, listLayout, monthGridLayout, timeGridLayout } from './strategies.js'

const range = week('2026-09-07')
const context = contextFor(range)
const events = [
    event('timed', '2026-09-09T09:00', '2026-09-09T10:00'),
    event('allday', '2026-09-09T00:00', '2026-09-10T00:00', { allDay: true }),
    event('multi', '2026-09-10T09:00', '2026-09-12T09:00')
]

describe('timeGridLayout', () => {
    it('emits span positions for whole-day events and time positions for the rest', () => {
        const positions = timeGridLayout.layout(events, range, context)
        const kinds = Object.fromEntries(positions.map((p) => [p.event.id, p.kind]))
        expect(kinds).toEqual({ timed: 'time', allday: 'span', multi: 'span' })
    })

    it('lays the all-day row out as one row across every day', () => {
        const [span] = timeGridLayout
            .layout(events, range, context)
            .filter((p) => p.kind === 'span')
        expect(span).toMatchObject({ row: 0 })
    })
})

describe('monthGridLayout', () => {
    it('emits only span positions', () => {
        const positions = monthGridLayout.layout(events, range, { ...context, columnsPerRow: 7 })
        expect(positions.every((p) => p.kind === 'span')).toBe(true)
        expect(positions).toHaveLength(3)
    })
})

describe('listLayout', () => {
    it('emits nothing', () => {
        expect(listLayout.layout(events, range, context)).toEqual([])
    })
})

describe('builtinLayouts', () => {
    it('have unique names', () => {
        const names = builtinLayouts.map((s) => s.name)
        expect(new Set(names).size).toBe(names.length)
    })
})

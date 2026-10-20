import { describe, expect, it } from 'vitest'
import { contextFor, event, week } from '../../../tests/fixtures/layout.js'
import type { SchedulerEvent } from '../../types/event.types.js'
import { createPositionMemo } from './stable.js'
import { timeGridLayout } from './strategies.js'

const range = week('2026-09-07')
const context = contextFor(range)
const a = event('a', '2026-09-08T09:00', '2026-09-08T10:00')
const b = event('b', '2026-09-09T09:00', '2026-09-09T10:00')
const all = event('all', '2026-09-10T00:00', '2026-09-11T00:00', { allDay: true })
const layout = (events: SchedulerEvent[]) => timeGridLayout.layout(events, range, context)

describe('createPositionMemo', () => {
    it('hands back the previous object for every position that did not move', () => {
        const keep = createPositionMemo()
        const first = keep(layout([a, b, all]))
        const second = keep(layout([a, b, all]))
        expect(second).toHaveLength(3)
        second.forEach((position, i) => expect(position).toBe(first[i]))
    })

    it('replaces the position of the event that moved, and only that one', () => {
        const keep = createPositionMemo()
        const first = keep(layout([a, b]))
        const moved = event('b', '2026-09-09T11:00', '2026-09-09T12:00')
        const second = keep(layout([a, moved]))
        const byId = (list: typeof first, id: string) => list.find((p) => p.event.id === id)
        expect(byId(second, 'a')).toBe(byId(first, 'a'))
        expect(byId(second, 'b')).not.toBe(byId(first, 'b'))
        expect(byId(second, 'b')?.event).toBe(moved)
    })

    it('replaces a position whose event object changed even when its place did not', () => {
        const keep = createPositionMemo()
        const first = keep(layout([a]))
        const renamed = { ...a, title: 'renamed' }
        const [position] = keep(layout([renamed]))
        expect(position).not.toBe(first[0])
        expect(position.event).toBe(renamed)
    })

    it('keeps each day of an event that crosses midnight apart', () => {
        const keep = createPositionMemo()
        const late = event('late', '2026-09-08T20:00', '2026-09-09T04:00')
        const first = keep(layout([late]))
        const second = keep(layout([late]))
        expect(first).toHaveLength(2)
        expect(second[0]).toBe(first[0])
        expect(second[1]).toBe(first[1])
        expect(first[0]).not.toBe(first[1])
    })
})

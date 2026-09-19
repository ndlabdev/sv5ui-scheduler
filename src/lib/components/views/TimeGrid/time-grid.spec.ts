import { parseZonedDateTime } from '@internationalized/date'
import { describe, expect, it } from 'vitest'
import { createTimeScale } from '../../../core/time/scale.js'
import type { SpanPosition, TimePosition } from '../../../types/layout.types.js'
import type { BusinessHours } from '../../../types/range.types.js'
import type { ViewPreview } from '../../../types/view.types.js'
import {
    allDayLayout,
    columnTint,
    draggedEventId,
    ghostColumn,
    hourLabels,
    layersByDay,
    nowOffset,
    offHoursBlocks,
    scrollTop,
    slotTop,
    splitPositions
} from './time-grid.js'
import { timeGridVariants } from './time-grid.variants.js'

const scale = createTimeScale({ slotMinutes: 30, slotHeight: 24 })
const wednesday = parseZonedDateTime('2026-09-09T00:00[Asia/Ho_Chi_Minh]')
const hours: BusinessHours = { start: '09:00', end: '17:00', days: [1, 2, 3, 4, 5] }

function timed(
    id: string,
    dayIndex: number,
    top: number,
    options: { background?: boolean; continued?: boolean } = {}
): TimePosition {
    const start = wednesday.add({ days: dayIndex, hours: 9 })
    return {
        kind: 'time',
        event: {
            id,
            title: id,
            start,
            end: start.add({ hours: 1 }),
            background: options.background
        },
        dayIndex,
        segmentStart: options.continued ? start.add({ minutes: 30 }) : start,
        segmentEnd: start.add({ hours: 1 }),
        top,
        height: 48,
        left: 0,
        width: 1,
        column: 0,
        columns: 1
    }
}

function span(id: string, lane: number): SpanPosition {
    return {
        kind: 'span',
        event: { id, title: id, start: wednesday, end: wednesday.add({ days: 1 }), allDay: true },
        row: 0,
        lane,
        startColumn: 0,
        endColumn: 1,
        continuesBefore: false,
        continuesAfter: false
    }
}

describe('offHoursBlocks', () => {
    it('shades before opening and after closing on a business day', () => {
        expect(offHoursBlocks(wednesday, scale, hours, new Map())).toEqual([
            { top: 0, height: 432 },
            { top: 816, height: 336 }
        ])
    })

    it('shades nothing on holidays, days off or without business hours', () => {
        const holiday = new Map([['2026-09-09', { date: '2026-09-09', title: 'Day off' }]])
        expect(offHoursBlocks(wednesday, scale, hours, holiday)).toEqual([])
        expect(offHoursBlocks(wednesday.add({ days: 4 }), scale, hours, new Map())).toEqual([])
        expect(offHoursBlocks(wednesday, scale, undefined, new Map())).toEqual([])
    })

    it('drops a block without height', () => {
        expect(offHoursBlocks(wednesday, scale, { ...hours, start: '00:00' }, new Map())).toEqual([
            { top: 816, height: 336 }
        ])
    })
})

describe('hourLabels', () => {
    it('labels every hour but midnight', () => {
        const labels = hourLabels(scale, 'en-US', false, null)
        expect(labels.map((label) => label.hour)).toEqual(
            Array.from({ length: 23 }, (_, i) => i + 1)
        )
        expect(labels[0].top).toBe(48)
        expect(labels[8].parts.hour).toContain('09')
    })

    it('hides the hour labels the current time label would overlap', () => {
        const labels = hourLabels(scale, 'en-US', false, 485)
        expect(labels).toHaveLength(22)
        expect(labels.map((label) => label.hour)).not.toContain(10)
    })
})

describe('scrollTop', () => {
    const base = { firstDay: wednesday, scale, businessHours: undefined, single: false }

    it('opens several days at the current time, half an hour above it', () => {
        expect(scrollTop({ ...base, timed: [timed('a', 0, 600)], nowTop: 300 })).toBe(276)
        expect(scrollTop({ ...base, timed: [timed('a', 0, 600)], nowTop: null })).toBe(576)
    })

    it('opens a single day at its first event before the current time', () => {
        const events = [timed('a', 0, 600), timed('b', 0, 500)]
        expect(scrollTop({ ...base, single: true, timed: events, nowTop: 300 })).toBe(476)
    })

    it('ignores segments continued from an earlier day', () => {
        const events = [timed('a', 0, 0, { continued: true })]
        expect(scrollTop({ ...base, single: true, timed: events, nowTop: null })).toBe(312)
    })

    it('falls back to the business opening, then to seven in the morning', () => {
        expect(scrollTop({ ...base, timed: [], nowTop: null, businessHours: hours })).toBe(408)
        expect(scrollTop({ ...base, timed: [], nowTop: null })).toBe(312)
    })

    it('never scrolls above the top', () => {
        expect(scrollTop({ ...base, timed: [], nowTop: 10 })).toBe(0)
    })
})

describe('positions', () => {
    it('splits spans from timed segments and timed segments by day and layer', () => {
        const all = [timed('a', 0, 0), timed('b', 0, 0, { background: true }), timed('c', 1, 0)]
        const split = splitPositions([...all, span('d', 0)])
        expect(split.spans.map((p) => p.event.id)).toEqual(['d'])
        const layers = layersByDay(split.timed, 3)
        expect(layers.map((day) => day.foreground.map((p) => p.event.id))).toEqual([
            ['a'],
            ['c'],
            []
        ])
        expect(layers.map((day) => day.background.map((p) => p.event.id))).toEqual([['b'], [], []])
    })

    it('places a ghost as a share of the whole grid', () => {
        const position = { ...timed('a', 1, 0), left: 0.5, width: 0.5 }
        expect(ghostColumn(position, 2)).toEqual({ start: '75%', width: '25%' })
    })

    it('measures a slot from its minutes', () => {
        expect(slotTop(90, scale)).toBe(72)
    })
})

describe('all day row', () => {
    it('reports the dragged event only for moves and resizes', () => {
        const event = span('a', 0).event
        expect(draggedEventId(null)).toBeNull()
        expect(draggedEventId({ kind: 'create', event, positioned: [] })).toBeNull()
        expect(draggedEventId({ kind: 'move', event, positioned: [] })).toBe('a')
    })

    it('keeps the laid out spans and counts their lanes when idle', () => {
        const spans = [span('a', 0), span('b', 1)]
        expect(allDayLayout(spans, null, null)).toEqual({ spans, ghosts: [], laneCount: 2 })
    })

    it('adds a created ghost and counts its lane', () => {
        const preview: ViewPreview = {
            kind: 'create',
            event: span('new', 0).event,
            positioned: [span('new', 0)]
        }
        const layout = allDayLayout([span('a', 0)], preview, null)
        expect(layout.ghosts.map((p) => p.event.id)).toEqual(['new'])
        const lanes = [...layout.spans, ...layout.ghosts].map((p) => p.lane)
        expect(layout.laneCount).toBe(Math.max(...lanes) + 1)
    })

    it('keeps the lifted span last so its gesture stays attached', () => {
        const preview: ViewPreview = {
            kind: 'move',
            event: span('a', 0).event,
            positioned: [span('a', 0)]
        }
        const layout = allDayLayout([span('a', 0), span('b', 1)], preview, 'a')
        expect(layout.spans.at(-1)?.event.id).toBe('a')
    })

    it('tints holiday and today columns', () => {
        const classes = timeGridVariants()
        expect(columnTint(true, false)).toEqual([classes.holidayColumn(), ''])
        expect(columnTint(false, true)).toEqual(['', classes.todayColumn()])
    })
})

describe('visible hours', () => {
    const visible = createTimeScale({ slotMinutes: 30, slotHeight: 24, startHour: 7, endHour: 22 })

    it('labels only the hours inside the window, measured from its start', () => {
        const labels = hourLabels(visible, 'en-US', false, null)
        expect(labels.map((label) => label.hour)).toEqual(
            Array.from({ length: 14 }, (_, i) => i + 8)
        )
        expect(labels[0].top).toBe(48)
    })

    it('clips off hours shading to the window', () => {
        expect(offHoursBlocks(wednesday, visible, hours, new Map())).toEqual([
            { top: 0, height: 96 },
            { top: 480, height: 240 }
        ])
    })

    it('places the current time and the focus ring from the start of the window', () => {
        expect(nowOffset(wednesday.set({ hour: 6 }), visible)).toBeNull()
        expect(nowOffset(wednesday.set({ hour: 23 }), visible)).toBeNull()
        expect(nowOffset(wednesday.set({ hour: 8 }), visible)).toBe(48)
        expect(slotTop(480, visible)).toBe(48)
    })
})

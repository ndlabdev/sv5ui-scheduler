import { describe, expect, it } from 'vitest'
import type { SchedulerLabels } from '../../types/labels.types.js'
import { defaultLabels, mergeLabels, viewLabel } from './labels.js'
import { en } from './locales/en.js'
import { vi } from './locales/vi.js'
import * as all from '../../locales.js'

const keysOf = (labels: SchedulerLabels) => [
    ...Object.keys(labels).filter((k) => k !== 'announce'),
    ...Object.keys(labels.announce).map((k) => `announce.${k}`)
]

const event = (title: string) => ({ id: 'a', title, start: en as never, end: en as never })

describe('locales', () => {
    it('every locale covers the same keys as English', () => {
        expect(keysOf(vi).sort()).toEqual(keysOf(en).sort())
    })

    it.each(Object.entries(all))('%s fills every label with text', (_, labels) => {
        expect(keysOf(labels).sort()).toEqual(keysOf(en).sort())
        const texts = [
            ...Object.values(labels).filter((value): value is string => typeof value === 'string'),
            labels.more(3),
            labels.dayCell('D', 0),
            labels.dayCell('D', 2),
            labels.holidayDate('D', 'H'),
            labels.weekNumber(37),
            labels.weekNumberLabel(37),
            labels.eventCount(5),
            labels.duration(1, 30),
            labels.grid('V'),
            labels.event(event('T'), '9', '10'),
            labels.announce.cancelled,
            labels.announce.created(event('T')),
            labels.announce.moved(event('T'), '9'),
            labels.announce.resized(event('T'), '10'),
            labels.announce.deleted(event('T')),
            labels.announce.reverted(event('T')),
            labels.announce.conflict(event('T'))
        ]
        expect(texts.every((text) => text.trim().length > 0)).toBe(true)
        expect(labels.announce.created(event('Standup'))).toContain('Standup')
        expect(labels.event(event('Standup'), '9:00', '9:30')).toContain('9:30')
        if (labels !== en) expect(labels.today).not.toBe(en.today)
    })

    it('uses Russian plural forms', () => {
        expect([1, 3, 5, 21, 22, 25].map((count) => all.ru.eventCount(count))).toEqual([
            '1 событие',
            '3 события',
            '5 событий',
            '21 событие',
            '22 события',
            '25 событий'
        ])
    })

    it('uses Arabic plural forms', () => {
        expect([0, 1, 2, 3, 11, 100].map((count) => all.ar.eventCount(count))).toEqual([
            'لا توجد أحداث',
            'حدث واحد',
            'حدثان',
            '3 أحداث',
            '11 حدثًا',
            '100 حدث'
        ])
    })

    it('functions produce text', () => {
        const event = { id: 'a', title: 'Standup', start: en as never, end: en as never }
        expect(en.more(3)).toBe('+3 more')
        expect(vi.more(3)).toBe('+3 nữa')
        expect(en.event(event, '9:00', '9:30')).toContain('Standup')
        expect(vi.announce.reverted(event)).toContain('Standup')
    })
})

describe('mergeLabels', () => {
    it('returns the defaults untouched when nothing is given', () => {
        expect(mergeLabels(undefined)).toBe(defaultLabels)
    })

    it('overrides top level keys and nested announcements independently', () => {
        const merged = mergeLabels({ today: 'Now', announce: { cancelled: 'Stopped' } })
        expect(merged.today).toBe('Now')
        expect(merged.week).toBe('Week')
        expect(merged.announce.cancelled).toBe('Stopped')
        expect(merged.announce.deleted).toBe(defaultLabels.announce.deleted)
    })

    it('does not mutate the defaults', () => {
        mergeLabels({ today: 'X' })
        expect(defaultLabels.today).toBe('Today')
    })
})

describe('viewLabel', () => {
    it('translates the built-in view names and passes others through', () => {
        expect(viewLabel(vi, 'week')).toBe('Tuần')
        expect(viewLabel(en, 'timeline')).toBe('timeline')
    })
})

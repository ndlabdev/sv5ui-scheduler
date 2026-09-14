import { parseZonedDateTime } from '@internationalized/date'
import { describe, expect, it, vi } from 'vitest'
import type { SchedulerEvent } from '../../types/event.types.js'
import type { InteractionContext, InteractionPreview } from '../../types/interaction.types.js'
import type { MutationRequest } from '../../core/store/mutations.svelte.js'
import { defaultLabels } from '../../core/i18n/labels.js'
import { eachDay } from '../../core/time/range.js'
import { createTimeScale } from '../../core/time/scale.js'
import { GestureController, type GestureOptions } from './controller.svelte.js'
import type { GesturePoint } from './gesture.js'

const ZONE = 'UTC'
const at = (iso: string) => parseZonedDateTime(`${iso}[${ZONE}]`)
const point = (iso: string, allDay = false): GesturePoint => ({ date: at(iso), allDay })
const iso = (date: { toString(): string }) => date.toString().slice(0, 16)
const event = (
    id: string,
    start: string,
    end: string,
    extra: Partial<SchedulerEvent> = {}
): SchedulerEvent => ({
    id,
    title: id,
    start: at(start),
    end: at(end),
    ...extra
})

function harness(options: GestureOptions = {}) {
    const range = { start: at('2026-09-07T00:00'), end: at('2026-09-14T00:00') }
    const commits: MutationRequest[] = []
    const previews: (InteractionPreview | null)[] = []
    const announcements: string[] = []
    let ids = 0
    const context: InteractionContext = {
        view: 'week',
        viewLabel: 'Week',
        range,
        days: eachDay(range),
        columnsPerRow: 7,
        scale: createTimeScale({ slotMinutes: 30, slotHeight: 20 }),
        scheduler: {
            timeZone: ZONE,
            locale: 'en-US',
            weekStartsOn: 1,
            holidays: [],
            calendars: [],
            weekNumbers: false,
            hiddenDays: [],
            editable: true,
            direction: 'ltr',
            labels: defaultLabels,
            now: at('2026-09-09T12:00')
        },
        selectedEventId: null,
        select: vi.fn(),
        focus: null,
        setFocus: vi.fn(),
        step: vi.fn(),
        navigate: vi.fn(),
        selectSlot: vi.fn(),
        newEventId: () => `new-${++ids}`,
        hitTest: () => null,
        snap: (date) => date,
        getEvent: () => undefined,
        commit: (request) => void commits.push(request),
        setPreview: (preview) => void previews.push(preview),
        announce: (message) => void announcements.push(message)
    }
    const controller = new GestureController(
        () => context,
        () => options
    )
    return { controller, commits, previews, announcements }
}

describe('creation turned off', () => {
    it('neither previews nor commits a drag or a keyboard create', () => {
        const { controller, commits, previews, announcements } = harness({ creatable: false })
        controller.beginCreate(point('2026-09-09T09:00'))
        controller.update(point('2026-09-09T11:00'))
        expect(controller.active).toBe(false)
        expect(controller.commit()).toBe(false)
        controller.createAt(point('2026-09-09T09:00'))
        expect(commits).toEqual([])
        expect(previews).toEqual([])
        expect(announcements).toEqual([])
    })

    it('still moves existing events', () => {
        const { controller, commits } = harness({ creatable: false })
        controller.beginMove(
            event('a', '2026-09-09T09:00', '2026-09-09T10:00'),
            point('2026-09-09T09:00')
        )
        controller.update(point('2026-09-09T11:00'))
        expect(controller.commit()).toBe(true)
        expect(commits[0].kind).toBe('move')
    })
})

describe('create gesture', () => {
    it('previews one slot immediately and grows with the pointer', () => {
        const { controller, previews } = harness()
        controller.beginCreate(point('2026-09-09T09:00'))
        expect(controller.active).toBe(true)
        expect(previews.at(-1)).toMatchObject({ kind: 'create' })
        expect(iso(previews.at(-1)!.event.end)).toBe('2026-09-09T09:30')

        controller.update(point('2026-09-09T11:00'))
        expect(iso(previews.at(-1)!.event.end)).toBe('2026-09-09T11:00')
    })

    it('commits a create with a fresh id and the default title, then announces it', () => {
        const { controller, commits, announcements, previews } = harness()
        controller.beginCreate(point('2026-09-09T09:00'))
        controller.update(point('2026-09-09T10:00'))
        expect(controller.commit()).toBe(true)

        expect(commits).toHaveLength(1)
        expect(commits[0]).toMatchObject({ kind: 'create', eventId: 'new-1', before: null })
        expect(commits[0].after?.title).toBe('New event')
        expect(announcements).toEqual(['Created New event'])
        expect(previews.at(-1)).toBeNull()
        expect(controller.active).toBe(false)
    })

    it('does not create anything from a click that never moved', () => {
        const { controller, commits } = harness()
        controller.beginCreate(point('2026-09-09T09:00'))
        expect(controller.commit()).toBe(false)
        expect(commits).toEqual([])
    })

    it('creates one slot on demand for a keyboard or double click', () => {
        const { controller, commits } = harness()
        controller.createAt(point('2026-09-09T09:00'))
        expect(commits).toHaveLength(1)
        expect(iso(commits[0].after!.start)).toBe('2026-09-09T09:00')
        expect(iso(commits[0].after!.end)).toBe('2026-09-09T09:30')
    })
})

describe('move gesture', () => {
    it('refuses events that are not editable', () => {
        const { controller } = harness()
        const locked = event('a', '2026-09-09T09:00', '2026-09-09T10:00', { editable: false })
        const background = event('b', '2026-09-09T09:00', '2026-09-09T10:00', { background: true })
        expect(controller.beginMove(locked, point('2026-09-09T09:00'))).toBe(false)
        expect(controller.beginMove(background, point('2026-09-09T09:00'))).toBe(false)
        expect(controller.active).toBe(false)
    })

    it('commits a move with before and after and announces the new start', () => {
        const { controller, commits, announcements } = harness()
        const original = event('a', '2026-09-09T09:00', '2026-09-09T10:00')
        expect(controller.beginMove(original, point('2026-09-09T09:15'))).toBe(true)
        controller.update(point('2026-09-10T14:15'))
        controller.commit()

        expect(commits[0]).toMatchObject({ kind: 'move', eventId: 'a' })
        expect(commits[0].before).toBe(original)
        expect(iso(commits[0].after!.start)).toBe('2026-09-10T14:00')
        expect(iso(commits[0].after!.end)).toBe('2026-09-10T15:00')
        expect(announcements[0]).toBe('Moved a to 2:00 PM')
    })

    it('does not emit a new preview while the pointer stays inside the same slot', () => {
        const { controller, previews } = harness()
        controller.beginMove(
            event('a', '2026-09-09T09:00', '2026-09-09T10:00'),
            point('2026-09-09T09:00')
        )
        controller.update(point('2026-09-09T11:00'))
        const count = previews.length
        controller.update(point('2026-09-09T11:05'))
        controller.update(point('2026-09-09T11:10'))
        expect(previews.length).toBe(count)
        controller.update(point('2026-09-09T11:20'))
        expect(previews.length).toBe(count + 1)
    })

    it('drops a move that ends where it began', () => {
        const { controller, commits, previews } = harness()
        controller.beginMove(
            event('a', '2026-09-09T09:00', '2026-09-09T10:00'),
            point('2026-09-09T09:00')
        )
        controller.update(point('2026-09-09T09:10'))
        expect(controller.commit()).toBe(false)
        expect(commits).toEqual([])
        expect(previews.at(-1)).toBeNull()
    })
})

it('commits nothing when the pointer never moved, even from a whole-day cell', () => {
    const { controller, commits, previews } = harness()
    const timed = event('a', '2026-09-08T09:00', '2026-09-10T18:00')
    expect(controller.beginMove(timed, point('2026-09-08T00:00', true))).toBe(true)
    expect(controller.commit()).toBe(false)
    expect(commits).toEqual([])
    expect(previews.at(-1)).toBeNull()
})

describe('insert from outside', () => {
    it('creates at the drop point with no before, keeping the length while it moves', () => {
        const { controller, commits, previews, announcements } = harness()
        const draft = event('ext', '2026-09-09T09:00', '2026-09-09T10:30')
        controller.beginInsert(draft, point('2026-09-09T09:00'))
        expect(previews.at(-1)?.kind).toBe('create')
        controller.update(point('2026-09-10T14:10'))
        expect(controller.commit()).toBe(true)
        expect(commits[0]).toMatchObject({ kind: 'create', eventId: 'ext', before: null })
        expect(iso(commits[0].after!.start)).toBe('2026-09-10T14:00')
        expect(iso(commits[0].after!.end)).toBe('2026-09-10T15:30')
        expect(announcements[0]).toBe('Created ext')
    })

    it('commits at the entry point when dropped without moving', () => {
        const { controller, commits } = harness()
        controller.beginInsert(
            event('ext', '2026-09-09T09:00', '2026-09-09T10:00'),
            point('2026-09-09T09:00')
        )
        expect(controller.commit()).toBe(true)
        expect(iso(commits[0].after!.start)).toBe('2026-09-09T09:00')
    })

    it('abandon clears the preview without announcing', () => {
        const { controller, previews, announcements, commits } = harness()
        controller.beginInsert(
            event('ext', '2026-09-09T09:00', '2026-09-09T10:00'),
            point('2026-09-09T09:00')
        )
        controller.abandon()
        expect(controller.active).toBe(false)
        expect(previews.at(-1)).toBeNull()
        expect(announcements).toEqual([])
        expect(commits).toEqual([])
    })
})

describe('resize gesture', () => {
    it('commits a resize and announces the new end', () => {
        const { controller, commits, announcements } = harness()
        controller.beginResize(
            event('a', '2026-09-09T09:00', '2026-09-09T10:00'),
            'end',
            point('2026-09-09T10:00')
        )
        controller.update(point('2026-09-09T11:30'))
        controller.commit()
        expect(commits[0]).toMatchObject({ kind: 'resize' })
        expect(iso(commits[0].after!.end)).toBe('2026-09-09T11:30')
        expect(announcements[0]).toBe('a now ends at 11:30 AM')
    })
})

describe('cancel', () => {
    it('clears the preview, announces and commits nothing', () => {
        const { controller, commits, previews, announcements } = harness()
        controller.beginMove(
            event('a', '2026-09-09T09:00', '2026-09-09T10:00'),
            point('2026-09-09T09:00')
        )
        controller.update(point('2026-09-09T13:00'))
        controller.cancel()
        expect(controller.active).toBe(false)
        expect(previews.at(-1)).toBeNull()
        expect(commits).toEqual([])
        expect(announcements).toEqual(['Cancelled'])
    })

    it('is a no-op without a session', () => {
        const { controller, announcements } = harness()
        controller.cancel()
        controller.update(point('2026-09-09T13:00'))
        expect(announcements).toEqual([])
    })
})

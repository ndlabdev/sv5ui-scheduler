import { afterEach, describe, expect, it, vi } from 'vitest'
import { mergeLabels } from '../../../core/i18n/labels.js'
import { EventStore } from '../../../core/store/event-store.svelte.js'
import { normalizeEvents } from '../../../core/store/normalize.js'
import { createTimeScale } from '../../../core/time/scale.js'
import { startOfDay } from '../../../core/time/zone.js'
import type { SchedulerContext } from '../../../types/context.types.js'
import { ZONE, anchor } from '../../../../tests/fixtures/dom.js'
import { InteractionState } from './interaction-state.svelte.js'

const days = [startOfDay(anchor), startOfDay(anchor).add({ days: 1 })]
const scale = createTimeScale({ slotMinutes: 30, slotHeight: 24 })
const scheduler = { timeZone: ZONE, labels: mergeLabels(undefined) } as SchedulerContext

let root: HTMLElement

function column(index: number, left: number) {
    const element = document.createElement('div')
    element.dataset.schDayIndex = String(index)
    element.style.cssText = `position:absolute;top:0;left:${left}px;width:100px;height:480px`
    return element
}

function place(element: HTMLElement, left: number) {
    element.style.left = `${left}px`
}

function setup(attached = true) {
    root = document.createElement('div')
    root.style.cssText = 'position:fixed;top:0;left:0;width:200px;height:480px'
    const first = column(0, 0)
    const second = column(1, 100)
    root.append(first, second)
    document.body.append(root)
    const store = new EventStore<unknown>([], () => ({ weekStartsOn: 1 }))
    store.apply({
        type: 'reset',
        events: normalizeEvents(
            [{ id: 'a', title: 'A', start: '2026-09-09T09:00', end: '2026-09-09T10:00' }],
            ZONE
        )
    })
    const spies = { commit: vi.fn(), step: vi.fn(), navigate: vi.fn(), announce: vi.fn() }
    const state = new InteractionState<unknown>({
        root: () => (attached ? root : null),
        view: () => 'week',
        viewLabel: () => 'Week',
        range: () => ({ start: days[0], end: days[1].add({ days: 1 }) }),
        days: () => days,
        columnsPerRow: () => 2,
        scale: () => scale,
        scheduler: () => scheduler,
        slotMinutes: () => 30,
        creatable: () => true,
        store,
        ...spies
    })
    return { state, first, second, spies }
}

afterEach(() => root?.remove())

describe('InteractionState hit testing', () => {
    it('resolves a point to the day column and time under it', () => {
        const { state } = setup()
        const hit = state.hitTest(150, 96)
        expect(hit?.dayIndex).toBe(1)
        expect(hit?.date.hour).toBe(2)
        expect(state.hitTest(250, 96)).toBeNull()
    })

    it('reads the columns again on every hit while no gesture runs', () => {
        const { state, first, second } = setup()
        expect(state.hitTest(150, 10)?.dayIndex).toBe(1)
        place(first, 100)
        place(second, 0)
        expect(state.hitTest(150, 10)?.dayIndex).toBe(0)
    })

    it('keeps the columns for a running gesture until they are invalidated', () => {
        const { state, first, second } = setup()
        state.gesture.beginCreate({ date: days[0], allDay: false })
        expect(state.gesture.active).toBe(true)
        expect(state.hitTest(150, 10)?.dayIndex).toBe(1)
        place(first, 100)
        place(second, 0)
        expect(state.hitTest(150, 10)?.dayIndex).toBe(1)
        state.invalidateColumns()
        expect(state.hitTest(150, 10)?.dayIndex).toBe(0)
    })

    it('drops the columns when the preview clears', () => {
        const { state, first, second } = setup()
        state.gesture.beginCreate({ date: days[0], allDay: false })
        expect(state.hitTest(150, 10)?.dayIndex).toBe(1)
        place(first, 100)
        place(second, 0)
        state.setPreview(state.preview)
        expect(state.hitTest(150, 10)?.dayIndex).toBe(1)
        state.setPreview(null)
        expect(state.preview).toBeNull()
        expect(state.hitTest(150, 10)?.dayIndex).toBe(0)
    })

    it('returns nothing without a root element', () => {
        const { state } = setup(false)
        expect(state.hitTest(150, 96)).toBeNull()
    })
})

describe('InteractionState context', () => {
    it('reads and writes selection and focus through the context', () => {
        const { state } = setup()
        const { context } = state
        context.select('a')
        expect(state.selectedEventId).toBe('a')
        expect(context.selectedEventId).toBe('a')
        const focus = { dayIndex: 1, minutes: 60, allDay: false }
        context.setFocus(focus as never)
        expect(state.focus).toBe(focus)
        expect(context.focus).toBe(focus)
        expect(context.view).toBe('week')
        expect(context.days).toBe(days)
        expect(context.columnsPerRow).toBe(2)
        expect(context.scale).toBe(scale)
        expect(context.scheduler).toBe(scheduler)
    })

    it('forwards commands to the scheduler', () => {
        const { state, spies } = setup()
        const { context } = state
        expect(context.getEvent('a')?.title).toBe('A')
        const request = { kind: 'delete', eventId: 'a', before: context.getEvent('a'), after: null }
        context.commit(request as never)
        expect(spies.commit).toHaveBeenCalledWith(request)
        context.step(-1)
        expect(spies.step).toHaveBeenCalledWith(-1)
        context.navigate(days[1], 'day')
        expect(spies.navigate).toHaveBeenCalledWith(days[1], 'day')
        context.announce('Hello')
        expect(spies.announce).toHaveBeenCalledWith('Hello')
        expect(context.snap(anchor.set({ minute: 44 })).minute).toBe(30)
    })

    it('hands out a new event id on every call', () => {
        const { state } = setup()
        const ids = new Set(Array.from({ length: 5 }, () => state.context.newEventId()))
        expect(ids.size).toBe(5)
    })
})

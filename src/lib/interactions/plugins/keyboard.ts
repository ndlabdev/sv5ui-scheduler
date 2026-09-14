import { useEventListener } from 'sv5ui'
import type {
    GridFocus,
    InteractionContext,
    InteractionPlugin
} from '../../types/interaction.types.js'
import { describeEvent } from '../../core/a11y/announce.js'
import {
    clampFocus,
    isNavigationKey,
    navigate,
    type GridShape
} from '../../core/a11y/grid-navigation.js'
import { viewLabel } from '../../core/i18n/labels.js'
import { isInteractiveTarget, isTextField } from '../../dom/targets.js'
import { formatLongDate, formatTime } from '../../core/time/format.js'
import { isSameDay } from '../../core/time/zone.js'
import type { GestureController } from '../engine/controller.svelte.js'
import type { GesturePoint } from '../engine/gesture.js'

const MINUTES_PER_DAY = 1440
const DEFAULT_MINUTES = 540
const TIMED_CELL = '[data-sch-day-index]:not([data-sch-all-day])'

export function keyboardInteraction<T>(controller: GestureController<T>): InteractionPlugin<T> {
    return {
        name: 'keyboard',
        attach: (context) => (node) => {
            if (!node.hasAttribute('tabindex')) node.tabIndex = 0
            node.setAttribute('role', 'application')
            node.setAttribute(
                'aria-label',
                context.scheduler.labels.grid(viewLabel(context.scheduler.labels, context.view))
            )

            useEventListener(node, 'keydown', (event) => {
                if (belongsToChild(event, node)) return
                if (handleKey(event, context, controller, node)) event.preventDefault()
            })
            useEventListener(node, 'focus', () => {
                context.setFocus(currentFocus(context, node))
            })
            useEventListener(node, 'blur', () => {
                if (!controller.active) context.setFocus(null)
            })
        }
    }
}

function belongsToChild(event: KeyboardEvent, node: HTMLElement): boolean {
    if (!isInteractiveTarget(event.target, node) || event.key === 'Escape') return false
    const removal = event.key === 'Delete' || event.key === 'Backspace'
    return !removal || isTextField(event.target)
}

function handleKey<T>(
    event: KeyboardEvent,
    context: InteractionContext<T>,
    controller: GestureController<T>,
    node: HTMLElement
): boolean {
    if (event.key === 'Escape') return escape(context, controller)
    if (event.key === 'Enter') return enter(context, controller)
    if (event.key === 'Delete' || event.key === 'Backspace') return remove(context)
    if (isNavigationKey(event.key)) {
        const shape = shapeOf(context, node)
        const result = navigate(currentFocus(context, node), event.key, shape)
        context.setFocus(result.focus)
        if (result.step !== 0) context.step(result.step)
        context.announce(describeFocus(result.focus, context))
        return true
    }
    return false
}

function escape<T>(context: InteractionContext<T>, controller: GestureController<T>): boolean {
    if (controller.active) {
        controller.cancel()
        return true
    }
    if (context.selectedEventId !== null) {
        context.select(null)
        return true
    }
    return false
}

function enter<T>(context: InteractionContext<T>, controller: GestureController<T>): boolean {
    if (!context.focus) return false
    controller.createAt(pointFor(context.focus, context))
    return true
}

function remove<T>(context: InteractionContext<T>): boolean {
    const id = context.selectedEventId
    const before = id === null ? undefined : context.getEvent(id)
    if (!before || before.editable === false) return false
    context.commit({ kind: 'delete', eventId: before.id, before, after: null })
    context.select(null)
    context.announce(context.scheduler.labels.announce.deleted(before))
    return true
}

function shapeOf<T>(context: InteractionContext<T>, node: HTMLElement): GridShape {
    return {
        days: context.days.length,
        columnsPerRow: context.columnsPerRow,
        slotMinutes: context.scale.slotMinutes,
        minutesPerDay: MINUTES_PER_DAY,
        rtl: getComputedStyle(node).direction === 'rtl'
    }
}

function currentFocus<T>(context: InteractionContext<T>, node: HTMLElement): GridFocus {
    const shape = shapeOf(context, node)
    const timed = node.querySelector(TIMED_CELL) !== null
    if (context.focus) {
        const kept = timed ? context.focus : { ...context.focus, minutes: null }
        return clampFocus(kept, shape)
    }
    const today = context.days.findIndex((day) => isSameDay(day, context.scheduler.now))
    return clampFocus({ dayIndex: today, minutes: timed ? DEFAULT_MINUTES : null }, shape)
}

function pointFor<T>(focus: GridFocus, context: InteractionContext<T>): GesturePoint {
    const day = context.days[focus.dayIndex] ?? context.days[0]
    if (focus.minutes === null) return { date: day, allDay: true }
    return { date: day.add({ minutes: focus.minutes }), allDay: false }
}

function describeFocus<T>(focus: GridFocus, context: InteractionContext<T>): string {
    const point = pointFor(focus, context)
    const { locale, hour12 } = context.scheduler
    const date = formatLongDate(point.date, locale)
    const time = point.allDay
        ? context.scheduler.labels.allDay
        : formatTime(point.date, locale, hour12)
    const occupied = context.getEvent(context.selectedEventId ?? '')
    return occupied
        ? describeEvent(occupied, { labels: context.scheduler.labels, locale, hour12 })
        : `${date}, ${time}`
}

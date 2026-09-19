import type { GridFocus } from '../../types/interaction.types.js'

export type { GridFocus }

export interface GridShape {
    readonly days: number
    readonly columnsPerRow: number
    readonly slotMinutes: number
    readonly firstMinute?: number
    readonly minutesPerDay: number
    readonly rtl?: boolean
}

export type NavigationKey =
    'ArrowLeft' | 'ArrowRight' | 'ArrowUp' | 'ArrowDown' | 'Home' | 'End' | 'PageUp' | 'PageDown'

export interface NavigationResult {
    readonly focus: GridFocus
    readonly step: 1 | -1 | 0
}

const KEYS: readonly string[] = [
    'ArrowLeft',
    'ArrowRight',
    'ArrowUp',
    'ArrowDown',
    'Home',
    'End',
    'PageUp',
    'PageDown'
]

export function isNavigationKey(key: string): key is NavigationKey {
    return KEYS.includes(key)
}

type Handler = (focus: GridFocus, shape: GridShape) => NavigationResult

const HANDLERS: Record<NavigationKey, Handler> = {
    ArrowLeft: (focus, shape) => moveColumn(focus, shape.rtl ? 1 : -1, shape),
    ArrowRight: (focus, shape) => moveColumn(focus, shape.rtl ? -1 : 1, shape),
    ArrowUp: (focus, shape) =>
        focus.minutes === null
            ? moveColumn(focus, -shape.columnsPerRow, shape)
            : moveSlot(focus, -1, shape),
    ArrowDown: (focus, shape) =>
        focus.minutes === null
            ? moveColumn(focus, shape.columnsPerRow, shape)
            : moveSlot(focus, 1, shape),
    Home: (focus, shape) =>
        focus.minutes === null
            ? stay(startOfRow(focus, shape))
            : stay({ ...focus, minutes: firstSlot(shape) }),
    End: (focus, shape) =>
        focus.minutes === null
            ? stay(endOfRow(focus, shape))
            : stay({ ...focus, minutes: lastSlot(shape) }),
    PageUp: (focus) => ({ focus, step: -1 }),
    PageDown: (focus) => ({ focus, step: 1 })
}

export function navigate(focus: GridFocus, key: NavigationKey, shape: GridShape): NavigationResult {
    return HANDLERS[key](focus, shape)
}

export function clampFocus(focus: GridFocus, shape: GridShape): GridFocus {
    const dayIndex = Math.min(Math.max(focus.dayIndex, 0), Math.max(shape.days - 1, 0))
    if (focus.minutes === null) return { dayIndex, minutes: null }
    const slots = Math.round(focus.minutes / shape.slotMinutes)
    const minutes = Math.min(Math.max(slots * shape.slotMinutes, firstSlot(shape)), lastSlot(shape))
    return { dayIndex, minutes }
}

function moveColumn(focus: GridFocus, delta: number, shape: GridShape): NavigationResult {
    const next = focus.dayIndex + delta
    if (next < 0) return { focus: { ...focus, dayIndex: wrapBack(next, shape) }, step: -1 }
    if (next >= shape.days)
        return { focus: { ...focus, dayIndex: wrapForward(next, shape) }, step: 1 }
    return stay({ ...focus, dayIndex: next })
}

function moveSlot(focus: GridFocus, direction: 1 | -1, shape: GridShape): NavigationResult {
    const minutes = (focus.minutes ?? 0) + direction * shape.slotMinutes
    if (minutes < firstSlot(shape)) return stay({ ...focus, minutes: firstSlot(shape) })
    if (minutes > lastSlot(shape)) return stay({ ...focus, minutes: lastSlot(shape) })
    return stay({ ...focus, minutes })
}

function startOfRow(focus: GridFocus, shape: GridShape): GridFocus {
    const row = Math.floor(focus.dayIndex / shape.columnsPerRow)
    return { ...focus, dayIndex: row * shape.columnsPerRow }
}

function endOfRow(focus: GridFocus, shape: GridShape): GridFocus {
    const row = Math.floor(focus.dayIndex / shape.columnsPerRow)
    const last = row * shape.columnsPerRow + shape.columnsPerRow - 1
    return { ...focus, dayIndex: Math.min(last, shape.days - 1) }
}

function wrapBack(next: number, shape: GridShape): number {
    return ((next % shape.days) + shape.days) % shape.days
}

function wrapForward(next: number, shape: GridShape): number {
    return next % shape.days
}

function firstSlot(shape: GridShape): number {
    return shape.firstMinute ?? 0
}

function lastSlot(shape: GridShape): number {
    return shape.minutesPerDay - shape.slotMinutes
}

function stay(focus: GridFocus): NavigationResult {
    return { focus, step: 0 }
}

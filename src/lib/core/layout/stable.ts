import type { PositionedEvent, SpanPosition, TimePosition } from '../../types/layout.types.js'
import { sameZonedValue } from '../time/zone.js'

export type PositionMemo<T> = (next: PositionedEvent<T>[]) => PositionedEvent<T>[]

export function createPositionMemo<T>(): PositionMemo<T> {
    let previous = new Map<string, PositionedEvent<T>>()
    return (next) => {
        const current = new Map<string, PositionedEvent<T>>()
        const result = next.map((position) => {
            const key = uniqueKey(positionKey(position), current)
            const before = previous.get(key)
            const kept = before && samePosition(before, position) ? before : position
            current.set(key, kept)
            return kept
        })
        previous = current
        return result
    }
}

function positionKey<T>(position: PositionedEvent<T>): string {
    return position.kind === 'time'
        ? `time:${position.event.id}:${position.dayIndex}`
        : `span:${position.event.id}:${position.row}`
}

function uniqueKey(base: string, taken: ReadonlyMap<string, unknown>): string {
    let key = base
    for (let copy = 1; taken.has(key); copy++) key = `${base}#${copy}`
    return key
}

function samePosition<T>(a: PositionedEvent<T>, b: PositionedEvent<T>): boolean {
    if (a.event !== b.event) return false
    if (a.kind === 'time' && b.kind === 'time') return sameTime(a, b)
    if (a.kind === 'span' && b.kind === 'span') return sameSpan(a, b)
    return false
}

function sameTime<T>(a: TimePosition<T>, b: TimePosition<T>): boolean {
    return (
        a.dayIndex === b.dayIndex &&
        a.top === b.top &&
        a.height === b.height &&
        a.left === b.left &&
        a.width === b.width &&
        a.column === b.column &&
        a.columns === b.columns &&
        sameZonedValue(a.segmentStart, b.segmentStart) &&
        sameZonedValue(a.segmentEnd, b.segmentEnd)
    )
}

function sameSpan<T>(a: SpanPosition<T>, b: SpanPosition<T>): boolean {
    return (
        a.row === b.row &&
        a.lane === b.lane &&
        a.startColumn === b.startColumn &&
        a.endColumn === b.endColumn &&
        a.continuesBefore === b.continuesBefore &&
        a.continuesAfter === b.continuesAfter
    )
}

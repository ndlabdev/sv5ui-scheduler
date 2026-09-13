import type { DateRange } from '../../types/range.types.js'
import { isAfter, isBefore, max, min } from '../time/zone.js'

export type Coverage = readonly DateRange[]

export const EMPTY_COVERAGE: Coverage = []

export function cover(coverage: Coverage, range: DateRange): Coverage {
    const merged: DateRange[] = []
    let current = range
    for (const covered of coverage) {
        if (isBefore(covered.end, current.start) || isAfter(covered.start, current.end)) {
            merged.push(covered)
            continue
        }
        current = { start: min(covered.start, current.start), end: max(covered.end, current.end) }
    }
    merged.push(current)
    return merged.sort((a, b) => a.start.compare(b.start))
}

export function uncovered(coverage: Coverage, range: DateRange): DateRange[] {
    const gaps: DateRange[] = []
    let cursor = range.start
    for (const covered of coverage) {
        if (!isAfter(covered.end, cursor)) continue
        if (!isBefore(covered.start, range.end)) break
        if (isAfter(covered.start, cursor))
            gaps.push({ start: cursor, end: min(covered.start, range.end) })
        cursor = max(cursor, covered.end)
        if (!isBefore(cursor, range.end)) return gaps
    }
    if (isBefore(cursor, range.end)) gaps.push({ start: cursor, end: range.end })
    return gaps
}

export function covers(coverage: Coverage, range: DateRange): boolean {
    return uncovered(coverage, range).length === 0
}

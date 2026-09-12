import type { ZonedDateTime } from '@internationalized/date'
import type { HitTarget, TimeScale } from '../types/extension.types.js'

export interface ColumnRect {
    readonly dayIndex: number
    readonly left: number
    readonly right: number
    readonly top: number
    readonly bottom: number
    readonly allDay: boolean
}

export interface HitTestInput {
    readonly clientX: number
    readonly clientY: number
    readonly columns: readonly ColumnRect[]
    readonly days: readonly ZonedDateTime[]
    readonly scale: TimeScale
    readonly eventId?: string | null
}

export function resolveHit(input: HitTestInput): HitTarget | null {
    const { clientX, clientY } = input
    const column = input.columns.find(
        (rect) =>
            clientX >= rect.left &&
            clientX < rect.right &&
            clientY >= rect.top &&
            clientY < rect.bottom
    )
    if (!column) return null
    const dayStart = input.days[column.dayIndex]
    if (!dayStart) return null
    const date = column.allDay ? dayStart : input.scale.toDate(clientY - column.top, dayStart)
    return {
        date,
        dayIndex: column.dayIndex,
        allDay: column.allDay,
        eventId: input.eventId ?? null
    }
}

export function collectColumnRects(grid: HTMLElement): ColumnRect[] {
    const rects: ColumnRect[] = []
    for (const element of grid.querySelectorAll<HTMLElement>('[data-sch-day-index]')) {
        const rect = element.getBoundingClientRect()
        rects.push({
            dayIndex: Number(element.dataset.schDayIndex),
            left: rect.left,
            right: rect.right,
            top: rect.top,
            bottom: rect.bottom,
            allDay: element.dataset.schAllDay !== undefined
        })
    }
    return rects
}

export function eventIdAt(target: EventTarget | null): string | null {
    if (!(target instanceof Element)) return null
    return target.closest<HTMLElement>('[data-sch-event-id]')?.dataset.schEventId ?? null
}

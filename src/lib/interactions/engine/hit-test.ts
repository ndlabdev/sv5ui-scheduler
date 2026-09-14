import type { ZonedDateTime } from '@internationalized/date'
import type { HitTarget } from '../../types/interaction.types.js'
import type { TimeScale } from '../../types/layout.types.js'

export interface ColumnRect {
    readonly dayIndex: number
    readonly left: number
    readonly right: number
    readonly top: number
    readonly bottom: number
    readonly originTop: number
    readonly allDay: boolean
    readonly keepsTime: boolean
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
    const date = column.allDay ? dayStart : input.scale.toDate(clientY - column.originTop, dayStart)
    return {
        date,
        dayIndex: column.dayIndex,
        allDay: column.allDay,
        keepsTime: column.keepsTime,
        eventId: input.eventId ?? null
    }
}

export function collectColumnRects(root: HTMLElement): ColumnRect[] {
    const rects: ColumnRect[] = []
    for (const element of root.querySelectorAll<HTMLElement>('[data-sch-day-index]')) {
        const rect = visibleRect(element, root)
        if (rect.bottom <= rect.top || rect.right <= rect.left) continue
        rects.push({
            dayIndex: Number(element.dataset.schDayIndex),
            ...rect,
            originTop: element.getBoundingClientRect().top,
            allDay: element.dataset.schAllDay !== undefined,
            keepsTime: element.dataset.schDayCell !== undefined
        })
    }
    return rects
}

function visibleRect(element: HTMLElement, root: HTMLElement) {
    const rect = element.getBoundingClientRect()
    let clip = { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom }
    for (let node = element.parentElement; node && node !== root; node = node.parentElement) {
        if (getComputedStyle(node).overflowY === 'visible') continue
        const bounds = node.getBoundingClientRect()
        clip = {
            left: Math.max(clip.left, bounds.left),
            right: Math.min(clip.right, bounds.right),
            top: Math.max(clip.top, bounds.top),
            bottom: Math.min(clip.bottom, bounds.bottom)
        }
    }
    return clip
}

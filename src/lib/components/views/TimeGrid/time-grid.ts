import { parseZonedDateTime, type ZonedDateTime } from '@internationalized/date'
import { insertSpans } from '../../../core/layout/spans.js'
import { isBusinessDay, isoDate, parseClock } from '../../../core/time/day-flags.js'
import { formatHourParts } from '../../../core/time/format.js'
import type {
    PositionedEvent,
    SpanPosition,
    TimePosition,
    TimeScale
} from '../../../types/layout.types.js'
import type { BusinessHours, Holiday } from '../../../types/range.types.js'
import type { ViewPreview } from '../../../types/view.types.js'
import { timeGridVariants } from './time-grid.variants.js'

export const COMPACT_HEIGHT = 38
export const BODY_COLUMNS = '4rem minmax(0, 1fr)'

const DEFAULT_SCROLL_HOUR = 7
const NOW_LABEL_CLEARANCE = 12
const MINUTES_PER_HOUR = 60
const LABELLED_HOURS = 23
const EMPTY_OFFSET = 20

const tints = timeGridVariants()

export interface PixelBlock {
    top: number
    height: number
}

export interface DayLayers<T> {
    background: TimePosition<T>[]
    foreground: TimePosition<T>[]
}

export interface AllDayLayout<T> {
    spans: SpanPosition<T>[]
    ghosts: SpanPosition<T>[]
    laneCount: number
}

export interface HourLabel {
    hour: number
    top: number
    parts: ReturnType<typeof formatHourParts>
}

export interface ScrollInput<T> {
    timed: readonly TimePosition<T>[]
    firstDay: ZonedDateTime
    scale: TimeScale
    nowTop: number | null
    businessHours: BusinessHours | undefined
    single: boolean
}

export function dayColumns(count: number): string {
    return `repeat(${count}, minmax(0, 1fr))`
}

export function headerColumns(count: number): string {
    return `4rem ${dayColumns(count)}`
}

export function hourHeight(scale: TimeScale): number {
    return scale.slotHeight * (MINUTES_PER_HOUR / scale.slotMinutes)
}

export function gridLines(scale: TimeScale): string {
    const hour = hourHeight(scale)
    return `repeating-linear-gradient(to bottom, transparent 0 ${hour - 1}px, color-mix(in oklab, var(--color-outline-variant) 45%, transparent) ${hour - 1}px ${hour}px)`
}

export function slotTop(minutes: number, scale: TimeScale): number {
    return (minutes / scale.slotMinutes) * scale.slotHeight
}

export function splitPositions<T>(positioned: readonly PositionedEvent<T>[]) {
    return {
        spans: positioned.filter((p): p is SpanPosition<T> => p.kind === 'span'),
        timed: positioned.filter((p): p is TimePosition<T> => p.kind === 'time')
    }
}

export function layersByDay<T>(
    timed: readonly TimePosition<T>[],
    dayCount: number
): DayLayers<T>[] {
    return Array.from({ length: dayCount }, (_, dayIndex) => {
        const inDay = timed.filter((p) => p.dayIndex === dayIndex)
        return {
            background: inDay.filter((p) => p.event.background),
            foreground: inDay.filter((p) => !p.event.background)
        }
    })
}

export function draggedEventId<T>(preview: ViewPreview<T> | null): string | null {
    return preview?.kind === 'create' ? null : (preview?.event.id ?? null)
}

export function allDayLayout<T>(
    laidOut: SpanPosition<T>[],
    preview: ViewPreview<T> | null,
    draggingId: string | null
): AllDayLayout<T> {
    const previewSpans = splitPositions(preview?.positioned ?? []).spans
    const inserted = preview
        ? insertSpans(laidOut, previewSpans, draggingId)
        : { spans: laidOut, ghosts: [] }
    const lifted = laidOut.filter((span) => span.event.id === draggingId)
    return {
        spans: [...inserted.spans, ...lifted],
        ghosts: inserted.ghosts,
        laneCount: [...inserted.spans, ...inserted.ghosts].reduce(
            (max, p) => Math.max(max, p.lane + 1),
            0
        )
    }
}

export function columnTint(isHoliday: boolean, isToday: boolean): string[] {
    return [isHoliday ? tints.holidayColumn() : '', isToday ? tints.todayColumn() : '']
}

export function offHoursBlocks(
    day: ZonedDateTime,
    scale: TimeScale,
    hours: BusinessHours | undefined,
    holidays: ReadonlyMap<string, Holiday>
): PixelBlock[] {
    if (!hours || holidays.has(isoDate(day)) || !isBusinessDay(day, hours)) return []
    const open = scale.toPixel(day.set(parseClock(hours.start)))
    const close = scale.toPixel(day.set(parseClock(hours.end)))
    return [
        { top: 0, height: open },
        { top: close, height: scale.dayHeight - close }
    ].filter((block) => block.height > 0)
}

export function hourLabels(
    scale: TimeScale,
    locale: string,
    hour12: boolean | undefined,
    nowTop: number | null
): HourLabel[] {
    return Array.from({ length: LABELLED_HOURS }, (_, i) => {
        const hour = i + 1
        const clock = parseZonedDateTime(`2000-01-03T${String(hour).padStart(2, '0')}:00[UTC]`)
        return {
            hour,
            top: (hour * MINUTES_PER_HOUR * scale.slotHeight) / scale.slotMinutes,
            parts: formatHourParts(clock, locale, hour12)
        }
    }).filter((label) => nowTop === null || Math.abs(label.top - nowTop) >= NOW_LABEL_CLEARANCE)
}

export function scrollTop<T>(input: ScrollInput<T>): number {
    const starts = input.timed.filter((p) => p.segmentStart.compare(p.event.start) === 0)
    const first = starts.length > 0 ? Math.min(...starts.map((p) => p.top)) : null
    const opening = input.businessHours
        ? parseClock(input.businessHours.start)
        : { hour: DEFAULT_SCROLL_HOUR, minute: 0 }
    const fallback = input.scale.toPixel(input.firstDay.set(opening))
    const target = input.single
        ? (first ?? input.nowTop ?? fallback)
        : (input.nowTop ?? first ?? fallback)
    return Math.max(target - hourHeight(input.scale) / 2, 0)
}

export function emptyTop(scale: TimeScale, nowTop: number | null): number {
    return nowTop === null
        ? scale.dayHeight / 2
        : Math.min(nowTop + EMPTY_OFFSET, scale.dayHeight - EMPTY_OFFSET * 2)
}

export function ghostColumn<T>(position: TimePosition<T>, dayCount: number) {
    return {
        start: `${((position.dayIndex + position.left) * 100) / dayCount}%`,
        width: `${(position.width * 100) / dayCount}%`
    }
}

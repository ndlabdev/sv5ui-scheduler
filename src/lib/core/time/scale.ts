import type { TimeScale } from '../../types/layout.types.js'
import { warnOnce } from '../utils/dev.js'

export interface TimeScaleOptions {
    slotMinutes?: number
    slotHeight?: number
    startHour?: number
    endHour?: number
}

const MINUTES_PER_HOUR = 60
const HOURS_PER_DAY = 24
const MINUTES_PER_DAY = HOURS_PER_DAY * MINUTES_PER_HOUR

function visibleHours(startHour: number, endHour: number) {
    const valid =
        Number.isInteger(startHour) &&
        Number.isInteger(endHour) &&
        startHour >= 0 &&
        endHour <= HOURS_PER_DAY &&
        startHour < endHour
    if (valid) return { startHour, endHour }
    warnOnce(
        `time-scale:${startHour}-${endHour}`,
        `Visible hours ${startHour} to ${endHour} are not a range inside one day; showing the whole day.`
    )
    return { startHour: 0, endHour: HOURS_PER_DAY }
}

export function createTimeScale({
    slotMinutes = 30,
    slotHeight = 24,
    startHour = 0,
    endHour = HOURS_PER_DAY
}: TimeScaleOptions = {}): TimeScale {
    const hours = visibleHours(startHour, endHour)
    const firstMinute = hours.startHour * MINUTES_PER_HOUR
    const lastMinute = hours.endHour * MINUTES_PER_HOUR
    const pixelsPerMinute = slotHeight / slotMinutes

    return {
        slotMinutes,
        slotHeight,
        startHour: hours.startHour,
        endHour: hours.endHour,
        dayHeight: (lastMinute - firstMinute) * pixelsPerMinute,
        toPixel(date) {
            const minutes = date.hour * MINUTES_PER_HOUR + date.minute + date.second / 60
            return (minutes - firstMinute) * pixelsPerMinute
        },
        toDate(pixel, dayStart) {
            const slots = Math.round(pixel / slotHeight)
            const minutes = Math.min(
                Math.max(firstMinute + slots * slotMinutes, firstMinute),
                lastMinute
            )
            if (minutes === MINUTES_PER_DAY)
                return dayStart.add({ days: 1 }).set({ hour: 0, minute: 0 })
            return dayStart.set({
                hour: Math.floor(minutes / MINUTES_PER_HOUR),
                minute: minutes % MINUTES_PER_HOUR
            })
        }
    }
}

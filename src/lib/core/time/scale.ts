import type { TimeScale } from '../../types/extension.types.js'
import { dayLengthMinutes, minutesBetween } from './zone.js'

export interface TimeScaleOptions {
    slotMinutes?: number
    slotHeight?: number
}

export function createTimeScale({
    slotMinutes = 30,
    slotHeight = 24
}: TimeScaleOptions = {}): TimeScale {
    const pixelsPerMinute = slotHeight / slotMinutes

    return {
        slotMinutes,
        slotHeight,
        toPixel(date, dayStart) {
            return minutesBetween(dayStart, date) * pixelsPerMinute
        },
        toDate(pixel, dayStart) {
            const slots = Math.round(pixel / slotHeight)
            const minutes = Math.min(Math.max(slots * slotMinutes, 0), dayLengthMinutes(dayStart))
            return dayStart.add({ minutes })
        },
        dayHeight(dayStart) {
            return dayLengthMinutes(dayStart) * pixelsPerMinute
        }
    }
}

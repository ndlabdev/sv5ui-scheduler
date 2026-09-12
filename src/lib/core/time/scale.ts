import type { TimeScale } from '../../types/extension.types.js'

export interface TimeScaleOptions {
    slotMinutes?: number
    slotHeight?: number
}

const MINUTES_PER_DAY = 1440

export function createTimeScale({
    slotMinutes = 30,
    slotHeight = 24
}: TimeScaleOptions = {}): TimeScale {
    const pixelsPerMinute = slotHeight / slotMinutes
    const dayHeight = MINUTES_PER_DAY * pixelsPerMinute

    return {
        slotMinutes,
        slotHeight,
        dayHeight,
        toPixel(date) {
            return (date.hour * 60 + date.minute + date.second / 60) * pixelsPerMinute
        },
        toDate(pixel, dayStart) {
            const slots = Math.round(pixel / slotHeight)
            const minutes = Math.min(Math.max(slots * slotMinutes, 0), MINUTES_PER_DAY)
            if (minutes === MINUTES_PER_DAY)
                return dayStart.add({ days: 1 }).set({ hour: 0, minute: 0 })
            return dayStart.set({ hour: Math.floor(minutes / 60), minute: minutes % 60 })
        }
    }
}

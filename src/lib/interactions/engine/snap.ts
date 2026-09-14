import type { ZonedDateTime } from '@internationalized/date'

export function snapToSlot(date: ZonedDateTime, slotMinutes: number): ZonedDateTime {
    const minutes = date.hour * 60 + date.minute + date.second / 60
    const snapped = Math.round(minutes / slotMinutes) * slotMinutes
    if (snapped >= 1440)
        return date.add({ days: 1 }).set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
    return date.set({
        hour: Math.floor(snapped / 60),
        minute: snapped % 60,
        second: 0,
        millisecond: 0
    })
}

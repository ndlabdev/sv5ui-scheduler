import { parseZonedDateTime } from '@internationalized/date'
import { describe, expect, it } from 'vitest'
import { createRange, splitByDay } from './range.js'
import { createTimeScale } from './scale.js'
import { startOfWeek } from './week.js'
import { endOfDay, minutesBetween, startOfDay, toZoned } from './zone.js'

interface Transition {
    zone: string
    day: string
    kind: 'gap' | 'overlap'
    length: number
    offsetBefore: string
    offsetAfter: string
    wall: string
}

const TRANSITIONS: Transition[] = [
    {
        zone: 'America/New_York',
        day: '2026-03-08',
        kind: 'gap',
        length: 1380,
        offsetBefore: '-05:00',
        offsetAfter: '-04:00',
        wall: '02:30'
    },
    {
        zone: 'America/New_York',
        day: '2026-11-01',
        kind: 'overlap',
        length: 1500,
        offsetBefore: '-04:00',
        offsetAfter: '-05:00',
        wall: '01:30'
    },
    {
        zone: 'Europe/London',
        day: '2026-03-29',
        kind: 'gap',
        length: 1380,
        offsetBefore: '+00:00',
        offsetAfter: '+01:00',
        wall: '01:30'
    },
    {
        zone: 'Europe/London',
        day: '2026-10-25',
        kind: 'overlap',
        length: 1500,
        offsetBefore: '+01:00',
        offsetAfter: '+00:00',
        wall: '01:30'
    },
    {
        zone: 'Australia/Sydney',
        day: '2026-04-05',
        kind: 'overlap',
        length: 1500,
        offsetBefore: '+11:00',
        offsetAfter: '+10:00',
        wall: '02:30'
    },
    {
        zone: 'Australia/Sydney',
        day: '2026-10-04',
        kind: 'gap',
        length: 1380,
        offsetBefore: '+10:00',
        offsetAfter: '+11:00',
        wall: '02:30'
    }
]

const zoned = (zone: string, day: string, time: string, offset = '') =>
    parseZonedDateTime(`${day}T${time}${offset}[${zone}]`)

const nextDay = (day: string) => zoned('UTC', day, '00:00').add({ days: 1 }).toString().slice(0, 10)

describe.each(TRANSITIONS)('$zone $day ($kind)', (t) => {
    const nine = zoned(t.zone, t.day, '09:00')
    const dayStart = startOfDay(nine)

    it('starts at midnight with the offset in force before the change', () => {
        expect(dayStart.toString()).toBe(`${t.day}T00:00:00${t.offsetBefore}[${t.zone}]`)
    })

    it(`is ${t.length} minutes long`, () => {
        expect(minutesBetween(dayStart, endOfDay(dayStart))).toBe(t.length)
        expect(minutesBetween(dayStart, endOfDay(nine))).toBe(t.length)
    })

    it('ends where the next day starts, with the offset after the change', () => {
        expect(endOfDay(nine).toString()).toBe(
            `${nextDay(t.day)}T00:00:00${t.offsetAfter}[${t.zone}]`
        )
    })

    it('keeps the wall clock when adding a day', () => {
        const before = zoned(t.zone, t.day, '09:00').subtract({ days: 1 })
        expect(before.add({ days: 1 }).toString()).toBe(nine.toString())
        expect(before.add({ days: 1 }).hour).toBe(9)
    })

    it('normalises a naive ISO string on that day to local wall time', () => {
        expect(toZoned(`${t.day}T09:00`, t.zone).toString()).toBe(nine.toString())
    })

    it('normalises an instant with an explicit offset', () => {
        const utc = nine.toDate().toISOString()
        expect(toZoned(utc, t.zone).toDate().getTime()).toBe(nine.toDate().getTime())
    })

    it('measures 09:00 from day start in real minutes, not wall clock', () => {
        const wallMinutes = 9 * 60
        const shift = t.kind === 'gap' ? -60 : 60
        expect(minutesBetween(startOfDay(nine), nine)).toBe(wallMinutes + shift)
    })

    it('splits an event crossing the change into segments of real length', () => {
        const range = createRange(zoned(t.zone, t.day, '00:30'), zoned(t.zone, t.day, '04:30'))
        const [segment] = splitByDay(range)
        expect(splitByDay(range)).toHaveLength(1)
        expect(minutesBetween(segment.start, segment.end)).toBe(240 + (t.kind === 'gap' ? -60 : 60))
    })

    it('splits an event that crosses midnight into two day segments', () => {
        const previous = zoned(t.zone, t.day, '09:00').subtract({ days: 1 })
        const range = createRange(previous.set({ hour: 23 }), zoned(t.zone, t.day, '01:00'))
        const segments = splitByDay(range)
        expect(segments).toHaveLength(2)
        expect(segments[0].end.toString()).toBe(dayStart.toString())
        expect(segments[1].start.toString()).toBe(dayStart.toString())
        expect(minutesBetween(segments[0].start, segments[0].end)).toBe(60)
        expect(minutesBetween(segments[1].start, segments[1].end)).toBe(60)
    })

    it('starts the week at midnight even when the change falls inside it', () => {
        const weekStart = startOfWeek(nine, 1)
        expect(weekStart.hour).toBe(0)
        expect(weekStart.minute).toBe(0)
        expect(minutesBetween(startOfDay(weekStart), weekStart)).toBe(0)
    })

    describe('TimeScale', () => {
        const scale = createTimeScale({ slotMinutes: 30, slotHeight: 20 })

        it('keeps every day column 24 hours tall', () => {
            expect(scale.dayHeight).toBe(48 * 20)
        })

        it('places 09:00 at the same pixel as on any other day', () => {
            expect(scale.toPixel(nine)).toBe(18 * 20)
        })

        it('round-trips clock times that exist exactly once', () => {
            for (const time of ['00:00', '00:30', '06:00', '09:00', '12:30', '23:30']) {
                const date = zoned(t.zone, t.day, time)
                expect(scale.toDate(scale.toPixel(date), dayStart).toString()).toBe(date.toString())
            }
        })

        it('maps the end of the column to the next midnight', () => {
            expect(scale.toDate(scale.dayHeight + 500, dayStart).toString()).toBe(
                endOfDay(nine).toString()
            )
        })
    })
})

describe('skipped wall time', () => {
    it.each(TRANSITIONS.filter((t) => t.kind === 'gap'))(
        '$zone $day $wall resolves forward to the first valid instant',
        (t) => {
            const resolved = toZoned(`${t.day}T${t.wall}`, t.zone)
            const [hour, minute] = t.wall.split(':').map(Number)
            expect(resolved.hour).toBe(hour + 1)
            expect(resolved.minute).toBe(minute)
            expect(resolved.offset).toBe(zoned(t.zone, t.day, '12:00').offset)
        }
    )

    it.each(TRANSITIONS.filter((t) => t.kind === 'gap'))(
        '$zone $day never snaps a pixel into the skipped hour',
        (t) => {
            const scale = createTimeScale({ slotMinutes: 30, slotHeight: 20 })
            const dayStart = startOfDay(zoned(t.zone, t.day, '12:00'))
            const [hour] = t.wall.split(':').map(Number)
            const snapped = scale.toDate(hour * 60 * (20 / 30) + 20, dayStart)
            expect(snapped.hour).toBe(hour + 1)
            expect(snapped.offset).toBe(zoned(t.zone, t.day, '12:00').offset)
        }
    )
})

describe('repeated wall time', () => {
    it.each(TRANSITIONS.filter((t) => t.kind === 'overlap'))(
        '$zone $day $wall keeps both instants apart',
        (t) => {
            const first = toZoned(`${t.day}T${t.wall}${t.offsetBefore}`, t.zone)
            const second = toZoned(`${t.day}T${t.wall}${t.offsetAfter}`, t.zone)
            expect(first.hour).toBe(second.hour)
            expect(first.minute).toBe(second.minute)
            expect(minutesBetween(first, second)).toBe(60)
            expect(
                minutesBetween(startOfDay(second), second) -
                    minutesBetween(startOfDay(first), first)
            ).toBe(60)
        }
    )

    it.each(TRANSITIONS.filter((t) => t.kind === 'overlap'))(
        '$zone $day $wall draws both instants at one pixel and picks the first on the way back',
        (t) => {
            const scale = createTimeScale({ slotMinutes: 30, slotHeight: 20 })
            const first = toZoned(`${t.day}T${t.wall}${t.offsetBefore}`, t.zone)
            const second = toZoned(`${t.day}T${t.wall}${t.offsetAfter}`, t.zone)
            expect(scale.toPixel(first)).toBe(scale.toPixel(second))
            const dayStart = startOfDay(first)
            expect(scale.toDate(scale.toPixel(second), dayStart).toString()).toBe(first.toString())
        }
    )

    it('resolves an ambiguous naive time to the earlier instant', () => {
        const resolved = toZoned('2026-11-01T01:30', 'America/New_York')
        expect(resolved.offset).toBe(-4 * 3600000)
    })
})

describe('day that starts after midnight', () => {
    const zone = 'America/Santiago'
    const day = zoned(zone, '2026-09-06', '09:00')

    it('starts at the first valid instant, 01:00', () => {
        expect(startOfDay(day).toString()).toBe('2026-09-06T01:00:00-03:00[America/Santiago]')
        expect(minutesBetween(startOfDay(startOfDay(day)), startOfDay(day))).toBe(0)
    })

    it('is 23 hours long counted from that instant', () => {
        expect(minutesBetween(startOfDay(day), endOfDay(startOfDay(day)))).toBe(1380)
    })

    it('treats 23:30 of the previous day as the previous day', () => {
        const late = zoned(zone, '2026-09-05', '23:30')
        expect(startOfDay(late).toString()).toBe('2026-09-05T00:00:00-04:00[America/Santiago]')
        expect(splitByDay(createRange(late, day))).toHaveLength(2)
    })
})

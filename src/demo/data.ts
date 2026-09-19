import { getDayOfWeek, getLocalTimeZone, today, type CalendarDate } from '@internationalized/date'
import type {
    BusinessHours,
    DragSourceData,
    EventInput,
    Holiday,
    SchedulerCalendar
} from '$lib/index.js'

export const timeZone = getLocalTimeZone()

export function startOfThisWeek(zone: string = timeZone): CalendarDate {
    const day = today(zone)
    return day.subtract({ days: getDayOfWeek(day, 'en-GB') })
}

const monday = startOfThisWeek()

export const todayOffset = getDayOfWeek(today(timeZone), 'en-GB')

export function dayAt(offset: number): string {
    return monday.add({ days: offset }).toString()
}

export function timeAt(offset: number, time: string): string {
    return `${dayAt(offset)}T${time}`
}

export const calendars: SchedulerCalendar[] = [
    { id: 'work', title: 'Work', color: 'primary' },
    { id: 'team', title: 'Team', color: 'info' },
    { id: 'personal', title: 'Personal', color: 'success' },
    { id: 'travel', title: 'Travel', color: 'warning' },
    { id: 'learning', title: 'Learning', color: 'tertiary' },
    { id: 'birthdays', title: 'Birthdays', color: 'secondary' }
]

export function teamEvents(): EventInput[] {
    return [
        {
            id: 'standup',
            title: 'Daily standup',
            calendarId: 'team',
            start: timeAt(-14, '09:00'),
            end: timeAt(-14, '09:15'),
            recurrence: { freq: 'weekly', byDay: [1, 2, 3, 4, 5] }
        },
        {
            id: 'planning',
            title: 'Sprint planning',
            calendarId: 'team',
            start: timeAt(0, '10:00'),
            end: timeAt(0, '11:30')
        },
        {
            id: 'design',
            title: 'Design review',
            calendarId: 'work',
            start: timeAt(1, '13:00'),
            end: timeAt(1, '14:30')
        },
        {
            id: 'pairing',
            title: 'Pairing with Linh',
            calendarId: 'work',
            start: timeAt(1, '14:00'),
            end: timeAt(1, '15:30')
        },
        {
            id: 'lunch',
            title: 'Lunch break',
            calendarId: 'personal',
            start: timeAt(2, '12:00'),
            end: timeAt(2, '13:00'),
            background: true
        },
        {
            id: 'roadmap',
            title: 'Roadmap sync',
            calendarId: 'work',
            start: timeAt(2, '15:00'),
            end: timeAt(2, '16:00')
        },
        {
            id: 'gym',
            title: 'Gym',
            calendarId: 'personal',
            start: timeAt(2, '18:30'),
            end: timeAt(2, '19:30')
        },
        {
            id: 'offsite',
            title: 'Team offsite',
            calendarId: 'team',
            start: dayAt(3),
            end: dayAt(5),
            allDay: true
        },
        {
            id: 'flight',
            title: 'Flight to Da Nang',
            calendarId: 'travel',
            start: timeAt(3, '07:30'),
            end: timeAt(3, '09:00')
        },
        {
            id: 'workshop',
            title: 'Svelte workshop',
            calendarId: 'learning',
            start: timeAt(4, '09:30'),
            end: timeAt(4, '12:00')
        },
        {
            id: 'release',
            title: 'Release window',
            calendarId: 'work',
            start: timeAt(4, '22:00'),
            end: timeAt(5, '01:00')
        },
        {
            id: 'reading',
            title: 'Reading club',
            calendarId: 'learning',
            start: timeAt(-3, '19:00'),
            end: timeAt(-3, '20:30')
        },
        {
            id: 'dentist',
            title: 'Dentist',
            calendarId: 'personal',
            start: timeAt(-2, '08:30'),
            end: timeAt(-2, '09:15')
        },
        {
            id: 'retro',
            title: 'Retrospective',
            calendarId: 'team',
            start: timeAt(7, '16:00'),
            end: timeAt(7, '17:00')
        },
        {
            id: 'birthday',
            title: "Mai's birthday",
            calendarId: 'birthdays',
            start: dayAt(9),
            end: dayAt(10),
            allDay: true
        },
        {
            id: 'summit',
            title: 'Svelte Summit',
            calendarId: 'learning',
            start: dayAt(15),
            end: dayAt(17),
            allDay: true
        }
    ]
}

export const dragSources: DragSourceData[] = [
    { title: 'Customer call', durationMinutes: 30, calendarId: 'work' },
    { title: 'Focus time', durationMinutes: 120, calendarId: 'learning' },
    { title: 'Coffee chat', durationMinutes: 45, calendarId: 'team' },
    { title: 'Pick up parcel', calendarId: 'personal' }
]

export const holidays: Holiday[] = [{ date: dayAt(11), title: 'Company holiday' }]

export const businessHours: BusinessHours = { start: '09:00', end: '18:00', days: [1, 2, 3, 4, 5] }

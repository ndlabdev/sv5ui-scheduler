import type { SchedulerLabels } from '../../../types/labels.types.js'

export const en: SchedulerLabels = {
    today: 'Today',
    previous: 'Previous',
    next: 'Next',
    month: 'Month',
    week: 'Week',
    day: 'Day',
    agenda: 'Agenda',
    year: 'Year',
    allDay: 'All day',
    views: 'View',
    menu: 'Toggle sidebar',
    actions: 'More actions',
    noEvents: 'No events',
    calendars: 'My calendars',
    searchEvents: 'Search events',
    unscheduled: 'Unscheduled',
    newEvent: 'New event',
    more: (count) => `+${count} more`,
    dayCell: (date, count) =>
        count === 0 ? `${date}, no events` : `${date}, ${count} event${count === 1 ? '' : 's'}`,
    holidayDate: (date, holiday) => `${date}, ${holiday}`,
    weekNumber: (week) => `W${week}`,
    weekNumberLabel: (week) => `Week ${week}`,
    eventCount: (count) => `${count} event${count === 1 ? '' : 's'}`,
    duration: (hours, minutes) =>
        [hours > 0 ? `${hours}h` : '', minutes > 0 ? `${minutes}m` : ''].filter(Boolean).join(' '),
    grid: (view) => `Calendar, ${view} view`,
    event: (event, start, end) => `${event.title}, ${start} to ${end}`,
    close: 'Close',
    deleteEvent: 'Delete event',
    announce: {
        created: (event) => `Created ${event.title}`,
        moved: (event, start) => `Moved ${event.title} to ${start}`,
        resized: (event, end) => `${event.title} now ends at ${end}`,
        deleted: (event) => `Deleted ${event.title}`,
        cancelled: 'Cancelled',
        reverted: (event) => `Could not save ${event.title}, change reverted`,
        conflict: (event) => `${event.title} was updated elsewhere`
    }
}

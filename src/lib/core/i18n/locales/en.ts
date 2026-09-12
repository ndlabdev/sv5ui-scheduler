import type { SchedulerLabels } from '../../../types/labels.types.js'

export const en: SchedulerLabels = {
    today: 'Today',
    previous: 'Previous',
    next: 'Next',
    month: 'Month',
    week: 'Week',
    day: 'Day',
    agenda: 'Agenda',
    allDay: 'All day',
    views: 'View',
    noEvents: 'No events',
    newEvent: 'New event',
    more: (count) => `+${count} more`,
    grid: (view) => `Calendar, ${view} view`,
    event: (event, start, end) => `${event.title}, ${start} to ${end}`,
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

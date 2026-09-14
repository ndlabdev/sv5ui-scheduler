import type { SchedulerLabels } from '../types/labels.types.js'

const afspraken = (count: number) => `${count} ${count === 1 ? 'afspraak' : 'afspraken'}`

export const nl: SchedulerLabels = {
    today: 'Vandaag',
    previous: 'Vorige',
    next: 'Volgende',
    month: 'Maand',
    week: 'Week',
    day: 'Dag',
    agenda: 'Agenda',
    year: 'Jaar',
    allDay: 'Hele dag',
    views: 'Weergave',
    menu: 'Zijbalk tonen of verbergen',
    sidebar: 'Kalender',
    actions: 'Meer acties',
    noEvents: 'Geen afspraken',
    calendars: "Mijn agenda's",
    searchEvents: 'Afspraken zoeken',
    unscheduled: 'Niet ingepland',
    newEvent: 'Nieuwe afspraak',
    more: (count) => `+${count} meer`,
    dayCell: (date, count) =>
        count === 0 ? `${date}, geen afspraken` : `${date}, ${afspraken(count)}`,
    holidayDate: (date, holiday) => `${date}, ${holiday}`,
    weekNumber: (week) => `W${week}`,
    weekNumberLabel: (week) => `Week ${week}`,
    eventCount: afspraken,
    duration: (hours, minutes) =>
        [hours > 0 ? `${hours} u` : '', minutes > 0 ? `${minutes} min` : '']
            .filter(Boolean)
            .join(' '),
    grid: (view) => `Agenda, weergave ${view}`,
    event: (event, start, end) => `${event.title}, ${start} tot ${end}`,
    close: 'Sluiten',
    deleteEvent: 'Afspraak verwijderen',
    announce: {
        created: (event) => `${event.title} aangemaakt`,
        moved: (event, start) => `${event.title} verplaatst naar ${start}`,
        resized: (event, end) => `${event.title} eindigt nu om ${end}`,
        deleted: (event) => `${event.title} verwijderd`,
        cancelled: 'Geannuleerd',
        reverted: (event) => `${event.title} kon niet worden opgeslagen, wijziging teruggedraaid`,
        conflict: (event) => `${event.title} is elders bijgewerkt`
    }
}

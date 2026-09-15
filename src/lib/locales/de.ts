import type { SchedulerLabels } from '../types/labels.types.js'

const termine = (count: number) => `${count} ${count === 1 ? 'Termin' : 'Termine'}`

export const de: SchedulerLabels = {
    today: 'Heute',
    previous: 'Zurück',
    next: 'Weiter',
    month: 'Monat',
    week: 'Woche',
    day: 'Tag',
    agenda: 'Agenda',
    year: 'Jahr',
    allDay: 'Ganztägig',
    views: 'Ansicht',
    menu: 'Seitenleiste ein- oder ausblenden',
    sidebar: 'Kalender',
    actions: 'Weitere Aktionen',
    noEvents: 'Keine Termine',
    calendars: 'Meine Kalender',
    searchEvents: 'Termine suchen',
    unscheduled: 'Nicht eingeplant',
    newEvent: 'Neuer Termin',
    createEvent: 'Termin erstellen',
    more: (count) => `+${count} weitere`,
    dayCell: (date, count) =>
        count === 0 ? `${date}, keine Termine` : `${date}, ${termine(count)}`,
    holidayDate: (date, holiday) => `${date}, ${holiday}`,
    weekNumber: (week) => `KW ${week}`,
    weekNumberLabel: (week) => `Kalenderwoche ${week}`,
    eventCount: termine,
    duration: (hours, minutes) =>
        [hours > 0 ? `${hours} Std.` : '', minutes > 0 ? `${minutes} Min.` : '']
            .filter(Boolean)
            .join(' '),
    grid: (view) => `Kalender, Ansicht ${view}`,
    event: (event, start, end) => `${event.title}, ${start} bis ${end}`,
    close: 'Schließen',
    deleteEvent: 'Termin löschen',
    announce: {
        created: (event) => `${event.title} erstellt`,
        moved: (event, start) => `${event.title} auf ${start} verschoben`,
        resized: (event, end) => `${event.title} endet jetzt um ${end}`,
        deleted: (event) => `${event.title} gelöscht`,
        cancelled: 'Abgebrochen',
        reverted: (event) =>
            `${event.title} konnte nicht gespeichert werden, Änderung rückgängig gemacht`,
        conflict: (event) => `${event.title} wurde an anderer Stelle geändert`
    }
}

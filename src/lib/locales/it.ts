import type { SchedulerLabels } from '../types/labels.types.js'

const eventi = (count: number) => `${count} ${count === 1 ? 'evento' : 'eventi'}`

export const it: SchedulerLabels = {
    today: 'Oggi',
    previous: 'Precedente',
    next: 'Successivo',
    month: 'Mese',
    week: 'Settimana',
    day: 'Giorno',
    agenda: 'Agenda',
    year: 'Anno',
    allDay: 'Tutto il giorno',
    views: 'Vista',
    menu: 'Mostra o nascondi la barra laterale',
    sidebar: 'Calendario',
    actions: 'Altre azioni',
    noEvents: 'Nessun evento',
    calendars: 'I miei calendari',
    searchEvents: 'Cerca eventi',
    unscheduled: 'Da pianificare',
    newEvent: 'Nuovo evento',
    createEvent: 'Crea evento',
    more: (count) => `+${count} altri`,
    dayCell: (date, count) =>
        count === 0 ? `${date}, nessun evento` : `${date}, ${eventi(count)}`,
    holidayDate: (date, holiday) => `${date}, ${holiday}`,
    weekNumber: (week) => `S${week}`,
    weekNumberLabel: (week) => `Settimana ${week}`,
    eventCount: eventi,
    duration: (hours, minutes) =>
        [hours > 0 ? `${hours} h` : '', minutes > 0 ? `${minutes} min` : '']
            .filter(Boolean)
            .join(' '),
    grid: (view) => `Calendario, vista ${view}`,
    event: (event, start, end) => `${event.title}, dalle ${start} alle ${end}`,
    close: 'Chiudi',
    deleteEvent: 'Elimina evento',
    announce: {
        created: (event) => `${event.title} creato`,
        moved: (event, start) => `${event.title} spostato alle ${start}`,
        resized: (event, end) => `${event.title} ora termina alle ${end}`,
        deleted: (event) => `${event.title} eliminato`,
        cancelled: 'Annullato',
        reverted: (event) => `Impossibile salvare ${event.title}, modifica annullata`,
        conflict: (event) => `${event.title} è stato modificato altrove`
    }
}

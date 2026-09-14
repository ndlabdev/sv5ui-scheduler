import type { SchedulerLabels } from '../types/labels.types.js'

const evenements = (count: number) => `${count} ${count > 1 ? 'événements' : 'événement'}`

export const fr: SchedulerLabels = {
    today: "Aujourd'hui",
    previous: 'Précédent',
    next: 'Suivant',
    month: 'Mois',
    week: 'Semaine',
    day: 'Jour',
    agenda: 'Agenda',
    year: 'Année',
    allDay: 'Toute la journée',
    views: 'Vue',
    menu: 'Afficher ou masquer la barre latérale',
    sidebar: 'Calendrier',
    actions: "Plus d'actions",
    noEvents: 'Aucun événement',
    calendars: 'Mes agendas',
    searchEvents: 'Rechercher des événements',
    unscheduled: 'Non planifié',
    newEvent: 'Nouvel événement',
    more: (count) => `+${count} de plus`,
    dayCell: (date, count) =>
        count === 0 ? `${date}, aucun événement` : `${date}, ${evenements(count)}`,
    holidayDate: (date, holiday) => `${date}, ${holiday}`,
    weekNumber: (week) => `S${week}`,
    weekNumberLabel: (week) => `Semaine ${week}`,
    eventCount: evenements,
    duration: (hours, minutes) =>
        [hours > 0 ? `${hours} h` : '', minutes > 0 ? `${minutes} min` : '']
            .filter(Boolean)
            .join(' '),
    grid: (view) => `Agenda, vue ${view}`,
    event: (event, start, end) => `${event.title}, de ${start} à ${end}`,
    close: 'Fermer',
    deleteEvent: "Supprimer l'événement",
    announce: {
        created: (event) => `${event.title} créé`,
        moved: (event, start) => `${event.title} déplacé à ${start}`,
        resized: (event, end) => `${event.title} se termine désormais à ${end}`,
        deleted: (event) => `${event.title} supprimé`,
        cancelled: 'Annulé',
        reverted: (event) => `Impossible d'enregistrer ${event.title}, modification annulée`,
        conflict: (event) => `${event.title} a été modifié ailleurs`
    }
}

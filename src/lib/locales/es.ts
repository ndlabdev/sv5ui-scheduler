import type { SchedulerLabels } from '../types/labels.types.js'

const eventos = (count: number) => `${count} ${count === 1 ? 'evento' : 'eventos'}`

export const es: SchedulerLabels = {
    today: 'Hoy',
    previous: 'Anterior',
    next: 'Siguiente',
    month: 'Mes',
    week: 'Semana',
    day: 'Día',
    agenda: 'Agenda',
    year: 'Año',
    allDay: 'Todo el día',
    views: 'Vista',
    menu: 'Mostrar u ocultar la barra lateral',
    actions: 'Más acciones',
    noEvents: 'No hay eventos',
    calendars: 'Mis calendarios',
    searchEvents: 'Buscar eventos',
    unscheduled: 'Sin programar',
    newEvent: 'Nuevo evento',
    more: (count) => `+${count} más`,
    dayCell: (date, count) => (count === 0 ? `${date}, sin eventos` : `${date}, ${eventos(count)}`),
    holidayDate: (date, holiday) => `${date}, ${holiday}`,
    weekNumber: (week) => `S${week}`,
    weekNumberLabel: (week) => `Semana ${week}`,
    eventCount: eventos,
    duration: (hours, minutes) =>
        [hours > 0 ? `${hours} h` : '', minutes > 0 ? `${minutes} min` : '']
            .filter(Boolean)
            .join(' '),
    grid: (view) => `Calendario, vista ${view}`,
    event: (event, start, end) => `${event.title}, de ${start} a ${end}`,
    close: 'Cerrar',
    deleteEvent: 'Eliminar evento',
    announce: {
        created: (event) => `${event.title} creado`,
        moved: (event, start) => `${event.title} movido a ${start}`,
        resized: (event, end) => `Nuevo fin de ${event.title}: ${end}`,
        deleted: (event) => `${event.title} eliminado`,
        cancelled: 'Cancelado',
        reverted: (event) => `No se pudo guardar ${event.title}, cambio revertido`,
        conflict: (event) => `${event.title} se actualizó en otro lugar`
    }
}

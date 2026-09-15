import type { SchedulerLabels } from '../types/labels.types.js'

const eventos = (count: number) => `${count} ${count === 1 ? 'evento' : 'eventos'}`

export const pt: SchedulerLabels = {
    today: 'Hoje',
    previous: 'Anterior',
    next: 'Próximo',
    month: 'Mês',
    week: 'Semana',
    day: 'Dia',
    agenda: 'Agenda',
    year: 'Ano',
    allDay: 'Dia inteiro',
    views: 'Visualização',
    menu: 'Mostrar ou ocultar a barra lateral',
    sidebar: 'Calendário',
    actions: 'Mais ações',
    noEvents: 'Nenhum evento',
    calendars: 'Minhas agendas',
    searchEvents: 'Pesquisar eventos',
    unscheduled: 'Não agendado',
    newEvent: 'Novo evento',
    createEvent: 'Criar evento',
    more: (count) => `+${count} mais`,
    dayCell: (date, count) =>
        count === 0 ? `${date}, nenhum evento` : `${date}, ${eventos(count)}`,
    holidayDate: (date, holiday) => `${date}, ${holiday}`,
    weekNumber: (week) => `S${week}`,
    weekNumberLabel: (week) => `Semana ${week}`,
    eventCount: eventos,
    duration: (hours, minutes) =>
        [hours > 0 ? `${hours} h` : '', minutes > 0 ? `${minutes} min` : '']
            .filter(Boolean)
            .join(' '),
    grid: (view) => `Agenda, visualização ${view}`,
    event: (event, start, end) => `${event.title}, das ${start} às ${end}`,
    close: 'Fechar',
    deleteEvent: 'Excluir evento',
    announce: {
        created: (event) => `${event.title} criado`,
        moved: (event, start) => `${event.title} movido para ${start}`,
        resized: (event, end) => `${event.title} agora termina às ${end}`,
        deleted: (event) => `${event.title} excluído`,
        cancelled: 'Cancelado',
        reverted: (event) => `Não foi possível salvar ${event.title}, alteração desfeita`,
        conflict: (event) => `${event.title} foi atualizado em outro lugar`
    }
}

import type { SchedulerLabels } from '../../../types/labels.types.js'

const rules = new Intl.PluralRules('ru')
const FORMS: Record<string, string> = { one: 'событие', few: 'события', many: 'событий' }
const sobytiya = (count: number) => `${count} ${FORMS[rules.select(count)] ?? 'события'}`

export const ru: SchedulerLabels = {
    today: 'Сегодня',
    previous: 'Назад',
    next: 'Вперёд',
    month: 'Месяц',
    week: 'Неделя',
    day: 'День',
    agenda: 'Расписание',
    year: 'Год',
    allDay: 'Весь день',
    views: 'Вид',
    menu: 'Показать или скрыть боковую панель',
    actions: 'Другие действия',
    noEvents: 'Нет событий',
    calendars: 'Мои календари',
    searchEvents: 'Поиск событий',
    unscheduled: 'Не запланировано',
    newEvent: 'Новое событие',
    more: (count) => `+${count} ещё`,
    dayCell: (date, count) =>
        count === 0 ? `${date}, нет событий` : `${date}, ${sobytiya(count)}`,
    holidayDate: (date, holiday) => `${date}, ${holiday}`,
    weekNumber: (week) => `Н${week}`,
    weekNumberLabel: (week) => `Неделя ${week}`,
    eventCount: sobytiya,
    duration: (hours, minutes) =>
        [hours > 0 ? `${hours} ч` : '', minutes > 0 ? `${minutes} мин` : '']
            .filter(Boolean)
            .join(' '),
    grid: (view) => `Календарь, вид: ${view}`,
    event: (event, start, end) => `${event.title}, с ${start} до ${end}`,
    close: 'Закрыть',
    deleteEvent: 'Удалить событие',
    announce: {
        created: (event) => `Создано: ${event.title}`,
        moved: (event, start) => `${event.title} перенесено на ${start}`,
        resized: (event, end) => `${event.title} теперь заканчивается в ${end}`,
        deleted: (event) => `Удалено: ${event.title}`,
        cancelled: 'Отменено',
        reverted: (event) => `Не удалось сохранить ${event.title}, изменение отменено`,
        conflict: (event) => `${event.title} изменено в другом месте`
    }
}

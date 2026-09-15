import type { SchedulerLabels } from '../types/labels.types.js'

const rules = new Intl.PluralRules('ar')
const FORMS: Record<string, (count: number) => string> = {
    zero: () => 'لا توجد أحداث',
    one: () => 'حدث واحد',
    two: () => 'حدثان',
    few: (count) => `${count} أحداث`,
    many: (count) => `${count} حدثًا`
}
const ahdath = (count: number) => (FORMS[rules.select(count)] ?? ((n) => `${n} حدث`))(count)

export const ar: SchedulerLabels = {
    today: 'اليوم',
    previous: 'السابق',
    next: 'التالي',
    month: 'شهر',
    week: 'أسبوع',
    day: 'يوم',
    agenda: 'جدول الأعمال',
    year: 'سنة',
    allDay: 'طوال اليوم',
    views: 'العرض',
    menu: 'إظهار الشريط الجانبي أو إخفاؤه',
    sidebar: 'التقويم',
    actions: 'إجراءات أخرى',
    noEvents: 'لا توجد أحداث',
    calendars: 'تقاويمي',
    searchEvents: 'البحث في الأحداث',
    unscheduled: 'غير مجدولة',
    newEvent: 'حدث جديد',
    createEvent: 'إنشاء حدث',
    openEvent: 'فتح التفاصيل',
    more: (count) => `+${count} أخرى`,
    dayCell: (date, count) => `${date}، ${ahdath(count)}`,
    holidayDate: (date, holiday) => `${date}، ${holiday}`,
    weekNumber: (week) => `أ${week}`,
    weekNumberLabel: (week) => `الأسبوع ${week}`,
    eventCount: ahdath,
    duration: (hours, minutes) =>
        [hours > 0 ? `${hours} س` : '', minutes > 0 ? `${minutes} د` : '']
            .filter(Boolean)
            .join(' '),
    grid: (view) => `التقويم، عرض ${view}`,
    event: (event, start, end) => `${event.title}، من ${start} إلى ${end}`,
    close: 'إغلاق',
    deleteEvent: 'حذف الحدث',
    announce: {
        created: (event) => `تم إنشاء ${event.title}`,
        moved: (event, start) => `تم نقل ${event.title} إلى ${start}`,
        resized: (event, end) => `${event.title} ينتهي الآن في ${end}`,
        deleted: (event) => `تم حذف ${event.title}`,
        cancelled: 'تم الإلغاء',
        reverted: (event) => `تعذر حفظ ${event.title}، تم التراجع عن التغيير`,
        conflict: (event) => `تم تحديث ${event.title} في مكان آخر`
    }
}

import type { SchedulerLabels } from '../types/labels.types.js'

export const ja: SchedulerLabels = {
    today: '今日',
    previous: '前へ',
    next: '次へ',
    month: '月',
    week: '週',
    day: '日',
    agenda: '予定リスト',
    year: '年',
    allDay: '終日',
    views: '表示',
    menu: 'サイドバーの表示切り替え',
    sidebar: 'カレンダー',
    actions: 'その他の操作',
    noEvents: '予定はありません',
    calendars: 'マイカレンダー',
    searchEvents: '予定を検索',
    unscheduled: '未設定の予定',
    newEvent: '新しい予定',
    more: (count) => `他 ${count} 件`,
    dayCell: (date, count) => (count === 0 ? `${date}、予定なし` : `${date}、予定 ${count} 件`),
    holidayDate: (date, holiday) => `${date}、${holiday}`,
    weekNumber: (week) => `第${week}週`,
    weekNumberLabel: (week) => `第${week}週`,
    eventCount: (count) => `${count} 件`,
    duration: (hours, minutes) =>
        [hours > 0 ? `${hours}時間` : '', minutes > 0 ? `${minutes}分` : '']
            .filter(Boolean)
            .join(''),
    grid: (view) => `カレンダー、${view}表示`,
    event: (event, start, end) => `${event.title}、${start}から${end}まで`,
    close: '閉じる',
    deleteEvent: '予定を削除',
    announce: {
        created: (event) => `${event.title} を作成しました`,
        moved: (event, start) => `${event.title} を ${start} に移動しました`,
        resized: (event, end) => `${event.title} の終了を ${end} に変更しました`,
        deleted: (event) => `${event.title} を削除しました`,
        cancelled: 'キャンセルしました',
        reverted: (event) => `${event.title} を保存できなかったため、変更を元に戻しました`,
        conflict: (event) => `${event.title} は別の場所で更新されました`
    }
}

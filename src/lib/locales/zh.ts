import type { SchedulerLabels } from '../types/labels.types.js'

export const zh: SchedulerLabels = {
    today: '今天',
    previous: '上一个',
    next: '下一个',
    month: '月',
    week: '周',
    day: '日',
    agenda: '日程列表',
    year: '年',
    allDay: '全天',
    views: '视图',
    menu: '显示或隐藏侧边栏',
    sidebar: '日历',
    actions: '更多操作',
    noEvents: '没有日程',
    calendars: '我的日历',
    searchEvents: '搜索日程',
    unscheduled: '未安排',
    newEvent: '新建日程',
    createEvent: '创建日程',
    openEvent: '打开详情',
    more: (count) => `还有 ${count} 项`,
    dayCell: (date, count) => (count === 0 ? `${date}，没有日程` : `${date}，${count} 个日程`),
    holidayDate: (date, holiday) => `${date}，${holiday}`,
    weekNumber: (week) => `第${week}周`,
    weekNumberLabel: (week) => `第${week}周`,
    eventCount: (count) => `${count} 个日程`,
    duration: (hours, minutes) =>
        [hours > 0 ? `${hours} 小时` : '', minutes > 0 ? `${minutes} 分钟` : '']
            .filter(Boolean)
            .join(' '),
    grid: (view) => `日历，${view}视图`,
    event: (event, start, end) => `${event.title}，${start} 至 ${end}`,
    close: '关闭',
    deleteEvent: '删除日程',
    announce: {
        created: (event) => `已创建 ${event.title}`,
        moved: (event, start) => `已将 ${event.title} 移至 ${start}`,
        resized: (event, end) => `${event.title} 现在于 ${end} 结束`,
        deleted: (event) => `已删除 ${event.title}`,
        cancelled: '已取消',
        reverted: (event) => `无法保存 ${event.title}，已撤销更改`,
        conflict: (event) => `${event.title} 已在其他地方更新`
    }
}

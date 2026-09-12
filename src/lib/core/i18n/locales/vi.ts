import type { SchedulerLabels } from '../../../types/labels.types.js'

export const vi: SchedulerLabels = {
    today: 'Hôm nay',
    previous: 'Trước',
    next: 'Sau',
    month: 'Tháng',
    week: 'Tuần',
    day: 'Ngày',
    agenda: 'Lịch trình',
    allDay: 'Cả ngày',
    views: 'Chế độ xem',
    noEvents: 'Không có sự kiện',
    newEvent: 'Sự kiện mới',
    more: (count) => `+${count} nữa`,
    grid: (view) => `Lịch, chế độ ${view}`,
    event: (event, start, end) => `${event.title}, từ ${start} đến ${end}`,
    announce: {
        created: (event) => `Đã tạo ${event.title}`,
        moved: (event, start) => `Đã chuyển ${event.title} sang ${start}`,
        resized: (event, end) => `${event.title} nay kết thúc lúc ${end}`,
        deleted: (event) => `Đã xoá ${event.title}`,
        cancelled: 'Đã huỷ',
        reverted: (event) => `Không lưu được ${event.title}, đã hoàn tác`,
        conflict: (event) => `${event.title} đã bị thay đổi ở nơi khác`
    }
}

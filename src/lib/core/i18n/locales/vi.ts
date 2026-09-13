import type { SchedulerLabels } from '../../../types/labels.types.js'

export const vi: SchedulerLabels = {
    today: 'Hôm nay',
    previous: 'Trước',
    next: 'Sau',
    month: 'Tháng',
    week: 'Tuần',
    day: 'Ngày',
    agenda: 'Lịch trình',
    year: 'Năm',
    allDay: 'Cả ngày',
    views: 'Chế độ xem',
    menu: 'Ẩn hiện thanh bên',
    actions: 'Thao tác khác',
    noEvents: 'Không có sự kiện',
    newEvent: 'Sự kiện mới',
    more: (count) => `+${count} nữa`,
    dayCell: (date, count) =>
        count === 0 ? `${date}, không có sự kiện` : `${date}, ${count} sự kiện`,
    eventCount: (count) => `${count} sự kiện`,
    duration: (hours, minutes) =>
        [hours > 0 ? `${hours} giờ` : '', minutes > 0 ? `${minutes} phút` : '']
            .filter(Boolean)
            .join(' '),
    grid: (view) => `Lịch, chế độ ${view}`,
    event: (event, start, end) => `${event.title}, từ ${start} đến ${end}`,
    close: 'Đóng',
    deleteEvent: 'Xoá sự kiện',
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

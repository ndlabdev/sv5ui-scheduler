import type { SchedulerLabels } from '../types/labels.types.js'

export const ko: SchedulerLabels = {
    today: '오늘',
    previous: '이전',
    next: '다음',
    month: '월',
    week: '주',
    day: '일',
    agenda: '일정 목록',
    year: '연',
    allDay: '종일',
    views: '보기',
    menu: '사이드바 표시 전환',
    sidebar: '캘린더',
    actions: '추가 작업',
    noEvents: '일정 없음',
    calendars: '내 캘린더',
    searchEvents: '일정 검색',
    unscheduled: '미예정',
    newEvent: '새 일정',
    createEvent: '일정 만들기',
    openEvent: '상세 열기',
    more: (count) => `+${count}개 더보기`,
    dayCell: (date, count) => (count === 0 ? `${date}, 일정 없음` : `${date}, 일정 ${count}개`),
    holidayDate: (date, holiday) => `${date}, ${holiday}`,
    weekNumber: (week) => `${week}주`,
    weekNumberLabel: (week) => `${week}번째 주`,
    eventCount: (count) => `일정 ${count}개`,
    duration: (hours, minutes) =>
        [hours > 0 ? `${hours}시간` : '', minutes > 0 ? `${minutes}분` : '']
            .filter(Boolean)
            .join(' '),
    grid: (view) => `캘린더, ${view} 보기`,
    event: (event, start, end) => `${event.title}, ${start}부터 ${end}까지`,
    close: '닫기',
    deleteEvent: '일정 삭제',
    announce: {
        created: (event) => `${event.title} 일정을 만들었습니다`,
        moved: (event, start) => `${event.title} 일정을 ${start}(으)로 옮겼습니다`,
        resized: (event, end) => `${event.title} 일정이 이제 ${end}에 끝납니다`,
        deleted: (event) => `${event.title} 일정을 삭제했습니다`,
        updated: (event) => `${event.title} 일정을 수정했습니다`,
        selected: (event) => `${event.title} 일정을 선택했습니다`,
        cancelled: '취소됨',
        reverted: (event) => `${event.title} 일정을 저장하지 못해 변경을 되돌렸습니다`,
        conflict: (event) => `${event.title} 일정이 다른 곳에서 변경되었습니다`
    }
}

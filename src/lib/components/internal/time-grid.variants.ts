import { tv } from 'tailwind-variants'

export const timeGridVariants = tv({
    slots: {
        root: 'bg-surface text-on-surface @container flex h-full min-h-0 flex-col overflow-hidden',
        header: 'border-outline-variant grid shrink-0 border-b',
        dayTitle: 'border-outline-variant flex shrink-0 flex-col gap-1 border-b px-4 py-3',
        dayTitleWeekday:
            'text-on-surface-variant text-[11px] font-semibold tracking-wide uppercase',
        dayTitleRow: 'flex items-center gap-3',
        dayTitleDate: 'text-on-surface truncate text-2xl font-semibold @max-md:text-xl',
        gutterSpacer: 'border-outline-variant border-r',
        dayHeader: [
            'border-outline-variant flex flex-col items-center gap-1 border-r py-2 last:border-r-0',
            'text-on-surface-variant'
        ],
        dayHeaderWeekend: 'bg-surface-container-low',
        dayHeaderToday: 'text-primary',
        dayHeaderTodayColumn: 'bg-primary/[0.05]',
        weekday: 'text-[11px] font-medium tracking-wide uppercase @max-md:text-[10px]',
        dayNumber: [
            'text-on-surface flex size-8 items-center justify-center rounded-full text-xl leading-none font-semibold',
            '@max-md:size-7 @max-md:text-base'
        ],
        dayNumberToday: 'bg-primary text-on-primary',
        allDayRow: 'border-outline-variant grid shrink-0 border-b',
        allDayLabel: [
            'border-outline-variant text-on-surface-variant flex items-start justify-end border-r px-2 py-1.5',
            'text-[11px] leading-none'
        ],
        allDayCells: 'relative grid',
        allDayCell: 'border-outline-variant border-r last:border-r-0',
        allDayCellWeekend: 'bg-surface-container-low',
        allDayEvents: 'pointer-events-none absolute inset-0 grid gap-y-0.5 py-1',
        allDayEvent: 'pointer-events-auto min-w-0 px-0.5',
        body: 'relative min-h-0 flex-1',
        scroll: 'h-full',
        bodyGrid: 'grid',
        gutter: 'border-outline-variant text-on-surface-variant relative border-r text-[11px] tabular-nums',
        hourLabel: 'absolute right-2 -translate-y-1/2 leading-none select-none',
        columns: 'relative grid',
        column: 'border-outline-variant relative border-r last:border-r-0',
        columnWeekend: 'bg-surface-container-low',
        columnToday: 'bg-primary/[0.035]',
        offHours: 'bg-surface-container-low pointer-events-none absolute right-0 left-0',
        background: [
            'bg-surface-container-highest/70 text-on-surface-variant pointer-events-none absolute right-0 left-0',
            'truncate px-2 py-1 text-[11px] leading-none'
        ],
        events: 'absolute inset-0',
        event: 'absolute min-w-0 px-px pb-px',
        nowLine: 'bg-error pointer-events-none absolute right-0 left-0 z-10 h-px',
        nowDot: 'bg-error absolute top-1/2 -left-1 size-2 -translate-y-1/2 rounded-full',
        nowLabel: [
            'text-error absolute right-1 -translate-y-1/2 text-[11px] leading-none font-semibold tabular-nums'
        ],
        empty: [
            'bg-surface-container text-on-surface-variant pointer-events-none absolute top-1/2 left-1/2 z-10',
            '-translate-x-1/2 -translate-y-1/2 rounded-full px-4 py-2 text-sm whitespace-nowrap'
        ]
    }
})

export type TimeGridSlots = keyof ReturnType<typeof timeGridVariants>

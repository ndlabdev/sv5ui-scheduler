import { tv } from 'tailwind-variants'

export const timeGridVariants = tv({
    slots: {
        root: [
            'bg-surface text-on-surface @container flex h-full min-h-0 flex-col overflow-hidden',
            'data-[sch-gesture=move]:**:cursor-grabbing data-[sch-gesture=move]:cursor-grabbing'
        ],
        dayTitle:
            'border-outline-variant/60 flex shrink-0 flex-col gap-0.5 border-b px-4 py-3 sm:px-6',
        dayTitleWeekday: 'text-on-surface-variant text-xs font-medium tracking-wide uppercase',
        dayTitleRow: 'flex items-center gap-2',
        dayTitleDate: 'text-on-surface truncate text-xl font-semibold',
        todayBadge: 'rounded-full',
        header: 'border-outline-variant/60 grid shrink-0 border-b',
        gutterSpacer: 'flex items-end justify-center pb-2',
        dayHeader: [
            'border-outline-variant/60 flex min-w-0 flex-col items-center border-s px-2 py-2 text-center'
        ],
        holidayColumn: 'bg-surface-container-low/70',
        todayColumn: 'bg-primary/5',
        holidayTitle: 'text-tertiary mt-1 max-w-full truncate text-[10px] leading-none font-medium',
        weekNumber: 'text-on-surface-variant text-[10px] font-medium tabular-nums',
        weekday: 'text-on-surface-variant text-[11px] font-medium uppercase',
        dayNumber: [
            'text-on-surface mt-1 flex size-8 items-center justify-center rounded-full text-sm font-semibold',
            '@max-md:size-7 @max-md:text-xs'
        ],
        dayNumberToday: 'bg-primary text-on-primary',
        dayNumberAnchor: 'text-primary ring-primary ring-1 ring-inset',
        allDayRow: 'border-outline-variant/60 bg-surface-container-low/40 grid shrink-0 border-b',
        allDayLabel: [
            'text-on-surface-variant flex items-center justify-end pe-2 text-[10px] font-medium tracking-wide uppercase'
        ],
        allDayCells: 'relative grid',
        allDayCell: 'border-outline-variant/60 relative border-s',
        allDayEvents: 'pointer-events-none absolute inset-0 grid gap-y-1 py-1',
        allDayEvent: 'pointer-events-auto min-w-0 cursor-pointer px-0.5 **:cursor-pointer',
        allDayEventDraggable: [
            'cursor-grab **:cursor-grab',
            'data-[sch-edge=x]:cursor-ew-resize data-[sch-edge=x]:**:cursor-ew-resize'
        ],
        allDayEventLifted: 'invisible',
        allDayGhost: 'pointer-events-none z-20 min-w-0 px-0.5',
        body: 'relative min-h-0 flex-1',
        scroll: 'h-full',
        bodyGrid: 'grid py-2',
        gutter: 'relative',
        hourLabel:
            'text-on-surface-variant absolute end-2 -translate-y-1/2 text-[11px] leading-none tabular-nums select-none',
        hourStrong: 'text-on-surface-variant font-medium',
        hourFaint: 'text-outline',
        columns: 'relative grid select-none focus-visible:outline-none',
        column: 'border-outline-variant/60 relative border-s',
        offHours: 'bg-surface-container-low/60 pointer-events-none absolute inset-x-0',
        background: [
            'bg-surface-container-highest/70 text-on-surface-variant pointer-events-none absolute inset-x-0',
            'truncate px-2 py-1 text-[11px] leading-none'
        ],
        events: 'absolute inset-0',
        event: 'absolute min-w-0 cursor-pointer px-0.5 pb-0.5 **:cursor-pointer',
        eventDraggable: [
            'cursor-grab **:cursor-grab',
            'data-[sch-edge=y]:cursor-ns-resize data-[sch-edge=y]:**:cursor-ns-resize'
        ],
        ghost: [
            'pointer-events-none absolute z-20 min-w-0 px-0.5 pb-0.5',
            'transition-[top,height,inset-inline-start,width] duration-75 ease-out motion-reduce:transition-none'
        ],
        ghostChip: 'ring-primary shadow-lg ring-2',
        focusRing: [
            'ring-primary pointer-events-none invisible absolute inset-x-0 z-10 rounded-sm ring-2 ring-inset',
            '[[role=application]:focus-visible_&]:visible'
        ],
        nowLine: 'pointer-events-none absolute inset-x-0 z-20 flex items-center',
        nowDot: 'bg-error -ms-1 size-2 shrink-0 rounded-full',
        nowRule: 'bg-error h-px flex-1',
        nowLabel: [
            'text-error absolute end-2 z-20 -translate-y-1/2 text-[10px] leading-none font-semibold tabular-nums'
        ],
        empty: [
            'bg-surface-container-high text-on-surface-variant pointer-events-none absolute left-1/2 z-10',
            '-translate-x-1/2 rounded-full px-3 py-1 text-xs whitespace-nowrap'
        ]
    }
})

export type TimeGridSlots = keyof ReturnType<typeof timeGridVariants>

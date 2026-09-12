import { tv } from 'tailwind-variants'

export const timeGridVariants = tv({
    slots: {
        root: 'bg-surface text-on-surface flex h-full min-h-0 flex-col overflow-hidden',
        header: 'border-outline-variant grid shrink-0 border-b',
        gutterSpacer: 'border-outline-variant border-r',
        dayHeader: [
            'border-outline-variant flex flex-col items-center gap-0.5 border-r px-1 py-2 last:border-r-0',
            'text-on-surface-variant text-xs uppercase'
        ],
        dayHeaderToday: 'text-primary',
        dayNumber: 'text-on-surface text-lg leading-none font-medium',
        dayNumberToday: 'bg-primary text-on-primary rounded-full px-2 py-0.5',
        allDayRow: 'border-outline-variant grid shrink-0 border-b',
        allDayLabel: [
            'border-outline-variant text-on-surface-variant border-r px-1 py-1 text-right text-[11px]'
        ],
        allDayCells: 'relative grid',
        allDayCell: 'border-outline-variant border-r last:border-r-0',
        allDayEvents: 'pointer-events-none absolute inset-0 grid gap-y-0.5 py-0.5',
        allDayEvent: 'pointer-events-auto min-w-0 px-0.5',
        body: 'relative min-h-0 flex-1 overflow-y-auto',
        bodyGrid: 'grid',
        gutter: 'border-outline-variant text-on-surface-variant relative border-r text-[11px]',
        hourLabel: 'absolute right-1 -translate-y-1/2 select-none',
        columns: 'relative grid',
        column: 'border-outline-variant relative border-r last:border-r-0',
        columnToday: 'bg-primary/[0.04]',
        offHours: 'bg-surface-container-low pointer-events-none absolute right-0 left-0',
        events: 'absolute inset-0',
        background: [
            'bg-surface-container-highest/70 text-on-surface-variant pointer-events-none absolute right-0 left-0',
            'truncate px-1.5 py-0.5 text-[11px]'
        ],
        event: 'absolute min-w-0 px-px',
        nowLine: 'bg-error pointer-events-none absolute right-0 left-0 z-10 h-0.5',
        nowDot: 'bg-error absolute top-1/2 -left-1 size-2 -translate-y-1/2 rounded-full'
    }
})

export type TimeGridSlots = keyof ReturnType<typeof timeGridVariants>

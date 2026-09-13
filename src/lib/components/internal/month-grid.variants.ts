import { tv } from 'tailwind-variants'

export const monthGridVariants = tv({
    slots: {
        root: 'bg-surface text-on-surface @container flex h-full min-h-0 flex-col overflow-hidden',
        header: 'border-outline-variant/60 grid shrink-0 border-b',
        weekday: [
            'text-on-surface-variant truncate px-3 py-2 text-left text-[11px] font-semibold tracking-wider uppercase',
            '@max-md:px-1 @max-md:text-center @max-md:text-[10px]'
        ],
        body: 'grid min-h-0 flex-1 select-none focus-visible:outline-none',
        row: 'relative grid min-h-0',
        cells: 'grid min-h-0',
        cell: [
            'border-outline-variant/60 relative flex min-w-0 flex-col overflow-hidden border-e border-b p-1.5',
            '[&:nth-child(7n)]:border-e-0'
        ],
        cellTodayColumn: 'bg-primary/5',
        cellFocus: 'ring-primary ring-2 ring-inset',
        cellHeader: 'relative z-10 flex shrink-0 items-start justify-between',
        dayNumber: 'text-on-surface inline-flex px-1 text-xs leading-6 font-semibold tabular-nums',
        dayNumberOutside: 'text-on-surface-variant/40',
        dayNumberToday: [
            'bg-primary text-on-primary flex size-6 items-center justify-center rounded-full px-0'
        ],
        moreTrigger: 'inline-flex',
        more: [
            'bg-on-surface/5 text-on-surface-variant hover:bg-on-surface/10 cursor-pointer rounded-full',
            'px-1.5 py-0.5 text-[10px] leading-none font-semibold',
            'focus-visible:ring-primary focus-visible:ring-2 focus-visible:outline-none'
        ],
        popover: 'w-60 p-2',
        popoverTitle: [
            'text-on-surface-variant px-1 pb-1.5 text-[11px] font-semibold tracking-wider uppercase'
        ],
        popoverList: 'flex flex-col gap-1',
        events: 'pointer-events-none absolute inset-x-0 grid',
        event: 'pointer-events-auto min-w-0 px-1.5 pt-1',
        ghost: 'pointer-events-none z-20 min-w-0 px-1.5 pt-1',
        ghostChip: 'ring-primary shadow-lg ring-2'
    }
})

export type MonthGridSlots = keyof ReturnType<typeof monthGridVariants>

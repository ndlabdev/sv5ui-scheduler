import { tv } from 'tailwind-variants'

export const monthGridVariants = tv({
    slots: {
        root: 'bg-surface text-on-surface @container flex h-full min-h-0 flex-col overflow-hidden',
        header: 'border-outline-variant grid shrink-0 border-b',
        weekday: [
            'border-outline-variant text-on-surface-variant border-r px-2 py-2 text-left last:border-r-0',
            'text-[11px] font-semibold tracking-wide uppercase @max-md:text-center @max-md:text-[10px]'
        ],
        weekdayWeekend: 'bg-surface-container-low',
        body: 'grid min-h-0 flex-1',
        row: 'border-outline-variant relative grid min-h-0 border-b last:border-b-0',
        cells: 'grid',
        cell: 'border-outline-variant flex min-w-0 flex-col border-r last:border-r-0',
        cellWeekend: 'bg-surface-container-low',
        cellOutside: 'text-on-surface-variant/60',
        cellToday: 'bg-primary/[0.035]',
        dayNumber: [
            'text-on-surface m-1 flex size-6 shrink-0 items-center justify-center self-start rounded-full',
            'text-xs font-semibold tabular-nums'
        ],
        dayNumberOutside: 'text-on-surface-variant/60 font-normal',
        dayNumberToday: 'bg-primary text-on-primary',
        events: 'pointer-events-none absolute inset-x-0 grid gap-y-0.5',
        event: 'pointer-events-auto min-w-0 px-1',
        moreRow: 'pointer-events-none absolute inset-x-0 grid',
        moreCell: 'pointer-events-auto min-w-0 px-1',
        moreTrigger: 'block w-full min-w-0',
        more: [
            'text-on-surface-variant block w-full cursor-pointer truncate rounded px-1 text-left text-[11px]',
            'hover:bg-surface-container hover:text-on-surface'
        ],
        popover: 'flex w-56 flex-col gap-1',
        popoverTitle: 'text-on-surface-variant px-1 pb-1 text-xs font-medium'
    }
})

export type MonthGridSlots = keyof ReturnType<typeof monthGridVariants>

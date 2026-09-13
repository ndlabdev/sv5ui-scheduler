import { tv } from 'tailwind-variants'

export const yearGridVariants = tv({
    slots: {
        root: 'bg-surface text-on-surface h-full min-h-0',
        scroll: 'h-full',
        months: 'grid gap-6 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
        month: 'min-w-0',
        monthTitle:
            'text-on-surface hover:text-primary mb-1.5 text-sm font-semibold transition-colors',
        weekdays: 'text-on-surface-variant/60 grid grid-cols-7 text-center text-[10px] font-medium',
        weekday: 'py-0.5',
        days: 'grid grid-cols-7',
        withWeekNumbers: 'grid-cols-[1.5rem_repeat(7,minmax(0,1fr))]',
        weekNumber: 'text-outline flex items-start justify-center pt-1 text-[9px] tabular-nums',
        day: 'flex flex-col items-center py-0.5 focus-visible:outline-none',
        number: [
            'text-on-surface hover:bg-surface-container-high flex size-5 items-center justify-center rounded-full text-[11px]',
            'transition-colors'
        ],
        numberOutside: 'text-outline hover:bg-transparent',
        numberHoliday: 'text-tertiary font-semibold',
        numberToday: 'bg-primary text-on-primary hover:bg-primary font-semibold',
        dot: 'mt-0.5 size-1 rounded-full',
        dotBusy: 'bg-primary'
    }
})

export type YearGridSlots = keyof ReturnType<typeof yearGridVariants>

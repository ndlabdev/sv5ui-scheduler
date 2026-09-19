import { tv } from 'tailwind-variants'

export const eventDetailsVariants = tv({
    slots: {
        root: 'flex flex-col gap-3 text-sm',
        row: 'flex gap-2.5',
        icon: 'text-on-surface-variant mt-0.5 shrink-0',
        calendarSwatch: 'ms-0.5 mt-1 size-3 shrink-0 rounded-sm',
        primary: 'text-on-surface font-medium',
        secondary: 'text-on-surface-variant',
        zone: 'tabular-nums'
    }
})

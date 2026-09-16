import { tv } from 'tailwind-variants'

export const calendarListVariants = tv({
    slots: {
        root: 'flex flex-col gap-1.5',
        title: 'text-on-surface-variant px-1 text-[11px] font-semibold tracking-wider uppercase',
        list: 'flex flex-col',
        item: 'hover:bg-surface-container-high rounded-md',
        label: 'flex min-w-0 cursor-pointer items-center gap-2.5 px-1.5 py-1.5',
        swatch: 'size-3 shrink-0 rounded-sm',
        name: 'text-on-surface min-w-0 flex-1 truncate text-sm',
        nameHidden: 'text-on-surface-variant'
    }
})

export type CalendarListSlots = Exclude<keyof ReturnType<typeof calendarListVariants>, 'nameHidden'>

export const calendarListDefaults = {
    defaultVariants: {},
    slots: {} as Partial<Record<CalendarListSlots, string>>
}

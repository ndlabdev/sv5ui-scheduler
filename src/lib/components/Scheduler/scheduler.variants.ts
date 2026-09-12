import { tv } from 'tailwind-variants'

export const schedulerVariants = tv({
    slots: {
        root: 'bg-surface text-on-surface flex h-full min-h-0 flex-col',
        toolbar: 'border-outline-variant flex shrink-0 items-center gap-3 border-b px-3 py-2',
        view: 'min-h-0 flex-1'
    }
})

export type SchedulerSlots = keyof ReturnType<typeof schedulerVariants>

export const schedulerDefaults = {
    defaultVariants: {},
    slots: {} as Partial<Record<SchedulerSlots, string>>
}

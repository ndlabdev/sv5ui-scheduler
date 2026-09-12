import { tv } from 'tailwind-variants'

export const schedulerVariants = tv({
    slots: {
        root: 'bg-surface text-on-surface flex h-full min-h-0 flex-col',
        toolbar:
            'border-outline-variant flex shrink-0 flex-wrap items-center gap-2 border-b px-3 py-2',
        view: 'relative min-h-0 flex-1',
        loading: 'bg-surface/60 absolute inset-0 z-20 p-4'
    }
})

export type SchedulerSlots = keyof ReturnType<typeof schedulerVariants>

export const schedulerDefaults = {
    defaultVariants: {},
    slots: {} as Partial<Record<SchedulerSlots, string>>
}

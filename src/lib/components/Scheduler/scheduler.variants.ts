import { tv } from 'tailwind-variants'

export const schedulerVariants = tv({
    slots: {
        root: 'bg-surface text-on-surface flex h-full min-h-0 flex-col',
        toolbar:
            'border-outline-variant flex shrink-0 flex-wrap items-center gap-2 border-b px-3 py-2',
        body: 'flex min-h-0 flex-1',
        bodyReversed: 'flex-row-reverse',
        sidebar: [
            'bg-surface-container-lowest border-outline-variant/60 flex w-72 shrink-0 flex-col',
            'border-e'
        ],
        sidebarScroll: 'min-h-0 flex-1',
        sidebarEnd: 'border-s border-e-0',
        slideover: 'w-80 max-w-full',
        view: 'relative min-h-0 flex-1',
        loading: 'bg-surface/60 absolute inset-0 z-20 p-4'
    }
})

export type SchedulerSlots = keyof ReturnType<typeof schedulerVariants>

export const schedulerDefaults = {
    defaultVariants: {},
    slots: {} as Partial<Record<SchedulerSlots, string>>
}

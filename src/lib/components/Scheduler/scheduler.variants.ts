import { tv } from 'tailwind-variants'

export const schedulerVariants = tv({
    slots: {
        root: 'bg-surface text-on-surface relative flex h-full min-h-0 flex-col overflow-clip',
        toolbar:
            'border-outline-variant flex shrink-0 flex-wrap items-center gap-2 border-b px-3 py-2',
        body: 'flex min-h-0 flex-1',
        bodyReversed: 'flex-row-reverse',
        sidebar: [
            'bg-surface-container-lowest border-outline-variant/60 flex w-72 shrink-0 flex-col',
            'border-e'
        ],
        sidebarScroll: 'min-h-0 w-72 flex-1',
        sidebarEnd: 'border-s border-e-0',
        slideoverOverlay: 'absolute',
        slideover: 'absolute w-80 max-w-full',
        slideoverBody: 'p-0 sm:p-0',
        detailPanel: 'absolute w-96 max-w-full',
        view: 'relative min-h-0 flex-1',
        loading: 'bg-surface/60 absolute inset-0 z-20 p-4'
    }
})

export type SchedulerSlots = keyof ReturnType<typeof schedulerVariants>

export const schedulerDefaults = {
    defaultVariants: {},
    slots: {} as Partial<Record<SchedulerSlots, string>>
}

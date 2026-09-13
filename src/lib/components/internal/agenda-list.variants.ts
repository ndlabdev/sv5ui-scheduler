import { tv } from 'tailwind-variants'

export const agendaListVariants = tv({
    slots: {
        root: 'bg-surface text-on-surface @container h-full min-h-0',
        scroll: 'h-full',
        list: 'pb-6',
        empty: 'flex h-full items-center justify-center p-8',
        groupHeader: [
            'bg-surface/95 border-outline-variant/60 sticky top-0 z-10 flex flex-wrap items-center gap-x-3 gap-y-1',
            'border-b px-4 py-2.5 backdrop-blur sm:px-6'
        ],
        groupDate: 'text-on-surface text-sm font-bold tracking-wide uppercase',
        todayBadge: 'rounded-full',
        groupMeta: 'text-on-surface-variant text-xs',
        rows: 'divide-outline-variant/40 divide-y',
        row: [
            'hover:bg-surface-container-low/60 flex w-full items-stretch gap-4 px-4 py-3 text-start sm:px-6',
            'focus-visible:ring-primary transition-colors focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset'
        ],
        rowSelected: 'bg-surface-container',
        time: 'w-16 shrink-0 pt-0.5 text-end',
        start: 'text-on-surface block text-sm font-semibold tabular-nums',
        end: 'text-on-surface-variant block text-xs tabular-nums',
        bar: 'w-1 shrink-0 rounded-full',
        body: 'min-w-0 flex-1',
        title: 'text-on-surface truncate text-sm font-semibold'
    }
})

export type AgendaListSlots = keyof ReturnType<typeof agendaListVariants>

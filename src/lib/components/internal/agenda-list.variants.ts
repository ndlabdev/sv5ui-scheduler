import { tv } from 'tailwind-variants'

export const agendaListVariants = tv({
    slots: {
        root: 'bg-surface text-on-surface @container h-full min-h-0',
        scroll: 'h-full',
        empty: 'flex h-full items-center justify-center p-8',
        group: 'border-outline-variant border-b last:border-b-0',
        groupHeader: [
            'bg-surface/95 border-outline-variant sticky top-0 z-10 flex items-baseline gap-3 border-b',
            'px-4 py-3 backdrop-blur'
        ],
        groupDate: 'text-on-surface text-sm font-bold tracking-wide uppercase',
        groupMeta: 'text-on-surface-variant text-xs',
        event: [
            'border-outline-variant hover:bg-surface-container-low flex w-full items-start gap-3 border-b',
            'px-4 py-3 text-left last:border-b-0',
            'focus-visible:ring-primary focus-visible:ring-2 focus-visible:-outline-offset-2 focus-visible:outline-none'
        ],
        eventSelected: 'bg-surface-container',
        time: 'text-on-surface w-24 shrink-0 text-sm font-medium tabular-nums @max-md:w-16',
        timeEnd: 'text-on-surface-variant block text-xs font-normal',
        bar: 'mt-0.5 h-10 w-1 shrink-0 rounded-full',
        body: 'min-w-0 flex-1',
        title: 'text-on-surface truncate text-sm font-semibold',
        meta: 'text-on-surface-variant truncate text-xs'
    },
    variants: {
        color: {
            primary: { bar: 'bg-primary' },
            secondary: { bar: 'bg-secondary' },
            tertiary: { bar: 'bg-tertiary' },
            success: { bar: 'bg-success' },
            warning: { bar: 'bg-warning' },
            error: { bar: 'bg-error' },
            info: { bar: 'bg-info' },
            surface: { bar: 'bg-outline' }
        }
    },
    defaultVariants: { color: 'primary' }
})

export type AgendaListSlots = keyof ReturnType<typeof agendaListVariants>

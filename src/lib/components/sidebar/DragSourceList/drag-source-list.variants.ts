import { tv } from 'tailwind-variants'

export const dragSourceListVariants = tv({
    slots: {
        root: 'flex flex-col gap-1.5',
        title: 'text-on-surface-variant px-1 text-[11px] font-semibold tracking-wider uppercase',
        list: 'flex flex-col gap-1',
        item: [
            'border-outline-variant/60 text-on-surface hover:bg-surface-container-high flex w-full cursor-grab items-center gap-2.5',
            'rounded-md border px-2 py-1.5 text-start text-sm select-none',
            'data-[sch-dragging]:cursor-grabbing data-[sch-dragging]:opacity-60',
            'focus-visible:ring-primary focus-visible:ring-2 focus-visible:outline-none'
        ],
        swatch: 'size-3 shrink-0 rounded-sm',
        name: 'min-w-0 flex-1 truncate',
        duration: 'text-on-surface-variant shrink-0 text-xs tabular-nums'
    }
})

export type DragSourceListSlots = keyof ReturnType<typeof dragSourceListVariants>

export const dragSourceListDefaults = {
    defaultVariants: {},
    slots: {} as Partial<Record<DragSourceListSlots, string>>
}

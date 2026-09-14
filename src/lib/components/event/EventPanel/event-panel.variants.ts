import { tv } from 'tailwind-variants'

export const eventPanelVariants = tv({
    slots: {
        heading: 'flex min-w-0 items-center gap-2',
        swatch: 'size-3 shrink-0 rounded-sm',
        title: 'truncate',
        body: 'flex flex-col gap-4'
    }
})

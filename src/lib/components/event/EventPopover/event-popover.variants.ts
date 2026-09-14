import { tv } from 'tailwind-variants'

export const eventPopoverVariants = tv({
    slots: {
        trigger: 'block h-full w-full min-w-0',
        content: 'w-auto overflow-hidden p-4',
        card: 'w-72',
        swatch: '-mx-4 -mt-4 mb-3 h-1',
        header: 'flex items-start justify-between gap-2',
        title: 'text-on-surface text-base font-semibold text-balance',
        actions: 'flex shrink-0 items-center',
        details: 'mt-3'
    }
})

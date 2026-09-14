import { tv } from 'tailwind-variants'

export const toolbarVariants = tv({
    slots: {
        navigation: 'flex min-w-0 items-center gap-2',
        chevrons: 'flex items-center',
        directional: 'rtl:-scale-x-100',
        title: 'text-on-surface truncate text-base font-semibold tracking-tight sm:text-lg',
        tools: 'ms-auto flex shrink-0 flex-nowrap items-center gap-1 sm:gap-2',
        switcherGroup: 'shrink-0',
        switcher: 'w-auto',
        actions: 'flex items-center gap-0.5'
    }
})

export type ToolbarSlots = keyof ReturnType<typeof toolbarVariants>

import { tv } from 'tailwind-variants'

export const toolbarVariants = tv({
    slots: {
        navigation: 'flex min-w-0 items-center gap-2',
        title: 'text-on-surface truncate text-xl font-semibold @max-md:text-base',
        tools: 'ml-auto flex items-center gap-1',
        switcher: 'bg-surface-container rounded-full p-0.5'
    }
})

export type ToolbarSlots = keyof ReturnType<typeof toolbarVariants>

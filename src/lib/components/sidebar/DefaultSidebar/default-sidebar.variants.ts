import { tv } from 'tailwind-variants'

export const defaultSidebarVariants = tv({
    slots: {
        root: 'flex min-h-full flex-col gap-5 p-4',
        header: 'flex flex-col gap-2',
        footer: 'mt-auto flex flex-col gap-2'
    }
})

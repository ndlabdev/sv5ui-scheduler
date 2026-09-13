import { tv } from 'tailwind-variants'

export const searchBoxVariants = tv({
    slots: {
        root: 'w-full',
        shortcut: ''
    }
})

export type SearchBoxSlots = keyof ReturnType<typeof searchBoxVariants>

export const searchBoxDefaults = {
    defaultVariants: {},
    slots: {} as Partial<Record<SearchBoxSlots, string>>
}

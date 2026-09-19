import { tv } from 'tailwind-variants'

export const dateNavigatorVariants = tv({
    slots: {
        root: 'flex flex-col gap-1',
        calendar: 'w-full',
        today: 'self-start text-xs'
    }
})

export type DateNavigatorSlots = keyof ReturnType<typeof dateNavigatorVariants>

export const dateNavigatorDefaults = {
    defaultVariants: {},
    slots: {} as Partial<Record<DateNavigatorSlots, string>>
}

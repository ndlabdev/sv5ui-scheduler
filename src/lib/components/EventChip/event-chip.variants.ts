import { tv, type VariantProps } from 'tailwind-variants'

export const eventChipVariants = tv({
    slots: {
        root: [
            'flex w-full min-w-0 flex-col items-start overflow-hidden rounded-md text-left',
            'ring-surface/60 ring-1 ring-inset',
            'transition-[box-shadow,filter,opacity] duration-150',
            'hover:shadow-sm hover:brightness-[0.97] dark:hover:brightness-110',
            'focus-visible:ring-primary focus-visible:ring-2 focus-visible:outline-none'
        ],
        title: 'w-full truncate leading-tight font-medium',
        time: 'w-full truncate leading-tight opacity-75'
    },
    variants: {
        color: {
            primary: { root: 'bg-primary-container text-on-primary-container' },
            secondary: { root: 'bg-secondary-container text-on-secondary-container' },
            tertiary: { root: 'bg-tertiary-container text-on-tertiary-container' },
            success: { root: 'bg-success-container text-on-success-container' },
            warning: { root: 'bg-warning-container text-on-warning-container' },
            error: { root: 'bg-error-container text-on-error-container' },
            info: { root: 'bg-info-container text-on-info-container' },
            surface: { root: 'bg-surface-container-high text-on-surface' }
        },
        size: {
            sm: { root: 'justify-center px-1.5 py-0 text-[11px]', title: 'text-[11px]' },
            md: { root: 'gap-0.5 px-2 py-1 text-xs', time: 'text-[11px]' }
        },
        selected: {
            true: { root: 'ring-primary ring-2 ring-inset' }
        },
        dragging: {
            true: { root: 'opacity-60 shadow-md' }
        },
        continuesBefore: {
            true: { root: 'rounded-l-none' }
        },
        continuesAfter: {
            true: { root: 'rounded-r-none' }
        }
    },
    defaultVariants: {
        color: 'primary',
        size: 'md'
    }
})

export type EventChipVariantProps = VariantProps<typeof eventChipVariants>
export type EventChipSlots = keyof ReturnType<typeof eventChipVariants>

export const eventChipDefaults = {
    defaultVariants: eventChipVariants.defaultVariants,
    slots: {} as Partial<Record<EventChipSlots, string>>
}

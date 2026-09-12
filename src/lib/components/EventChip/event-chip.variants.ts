import { tv, type VariantProps } from 'tailwind-variants'

export const eventChipVariants = tv({
    slots: {
        root: [
            'flex w-full min-w-0 flex-col items-start overflow-hidden rounded-md border-l-2 text-left',
            'px-1.5 py-0.5 text-xs leading-tight',
            'focus-visible:ring-primary focus-visible:ring-2 focus-visible:outline-none',
            'transition-opacity'
        ],
        title: 'w-full truncate font-medium',
        time: 'w-full truncate opacity-80'
    },
    variants: {
        color: {
            primary: { root: 'bg-primary-container text-on-primary-container border-primary' },
            secondary: {
                root: 'bg-secondary-container text-on-secondary-container border-secondary'
            },
            tertiary: { root: 'bg-tertiary-container text-on-tertiary-container border-tertiary' },
            success: { root: 'bg-success-container text-on-success-container border-success' },
            warning: { root: 'bg-warning-container text-on-warning-container border-warning' },
            error: { root: 'bg-error-container text-on-error-container border-error' },
            info: { root: 'bg-info-container text-on-info-container border-info' },
            surface: { root: 'bg-surface-container-high text-on-surface border-outline' }
        },
        size: {
            sm: { root: 'px-1 py-0 text-[11px]' },
            md: { root: 'px-1.5 py-0.5 text-xs' }
        },
        selected: {
            true: { root: 'ring-primary ring-2' }
        },
        dragging: {
            true: { root: 'opacity-60' }
        },
        continuesBefore: {
            true: { root: 'rounded-l-none border-l-0' }
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

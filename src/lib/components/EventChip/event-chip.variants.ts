import { tv, type VariantProps } from 'tailwind-variants'

const COLORS = [
    'primary',
    'secondary',
    'tertiary',
    'success',
    'warning',
    'error',
    'info',
    'surface'
] as const

type ChipColor = (typeof COLORS)[number]

export const EVENT_SWATCH: Record<ChipColor, string> = {
    primary: 'bg-primary',
    secondary: 'bg-secondary',
    tertiary: 'bg-tertiary',
    success: 'bg-success',
    warning: 'bg-warning',
    error: 'bg-error',
    info: 'bg-info',
    surface: 'bg-outline'
}

const SOFT: Record<ChipColor, string> = {
    primary: 'bg-primary-container text-on-primary-container',
    secondary: 'bg-secondary-container text-on-secondary-container',
    tertiary: 'bg-tertiary-container text-on-tertiary-container',
    success: 'bg-success-container text-on-success-container',
    warning: 'bg-warning-container text-on-warning-container',
    error: 'bg-error-container text-on-error-container',
    info: 'bg-info-container text-on-info-container',
    surface: 'bg-surface-container-high text-on-surface'
}

const SOLID: Record<ChipColor, string> = {
    primary: 'bg-primary text-on-primary',
    secondary: 'bg-secondary text-on-secondary',
    tertiary: 'bg-tertiary text-on-tertiary',
    success: 'bg-success text-on-success',
    warning: 'bg-warning text-on-warning',
    error: 'bg-error text-on-error',
    info: 'bg-info text-on-info',
    surface: 'bg-inverse-surface text-inverse-on-surface'
}

export const eventChipVariants = tv({
    slots: {
        root: [
            'w-full min-w-0 overflow-hidden text-start',
            'transition-[box-shadow,filter,opacity] duration-150',
            'hover:brightness-[0.97] dark:hover:brightness-110',
            'focus-visible:ring-primary focus-visible:ring-2 focus-visible:outline-none'
        ],
        swatch: 'pointer-events-none absolute inset-y-0 start-0 w-1',
        title: 'truncate font-semibold',
        time: 'shrink-0 truncate tabular-nums'
    },
    variants: {
        shape: {
            block: {
                root: 'relative flex h-full flex-col rounded-md py-1 ps-2.5 pe-1.5 text-xs',
                time: 'text-[11px]'
            },
            pill: {
                root: 'flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium',
                title: 'font-medium',
                swatch: 'hidden'
            }
        },
        color: {
            primary: { swatch: EVENT_SWATCH.primary },
            secondary: { swatch: EVENT_SWATCH.secondary },
            tertiary: { swatch: EVENT_SWATCH.tertiary },
            success: { swatch: EVENT_SWATCH.success },
            warning: { swatch: EVENT_SWATCH.warning },
            error: { swatch: EVENT_SWATCH.error },
            info: { swatch: EVENT_SWATCH.info },
            surface: { swatch: EVENT_SWATCH.surface }
        },
        variant: {
            soft: '',
            solid: ''
        },
        size: {
            sm: { root: 'py-0.5' },
            md: ''
        },
        selected: {
            true: { root: 'ring-primary ring-2 ring-inset' }
        },
        dragging: {
            true: { root: 'opacity-50' }
        },
        continuesBefore: {
            true: { root: 'rounded-s-none' }
        },
        continuesAfter: {
            true: { root: 'rounded-e-none' }
        }
    },
    compoundVariants: COLORS.flatMap((color) => [
        { color, variant: 'soft' as const, class: { root: SOFT[color] } },
        { color, variant: 'solid' as const, class: { root: SOLID[color] } }
    ]),
    defaultVariants: {
        color: 'primary',
        size: 'md',
        variant: 'soft',
        shape: 'block'
    }
})

export type EventChipVariantProps = VariantProps<typeof eventChipVariants>
export type EventChipSlots = keyof ReturnType<typeof eventChipVariants>

export const eventChipDefaults = {
    defaultVariants: eventChipVariants.defaultVariants,
    slots: {} as Partial<Record<EventChipSlots, string>>
}

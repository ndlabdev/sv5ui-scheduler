import type { Mutation, SchedulerEvent } from '$lib/index.js'

const timeFormat = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit'
})

const dateFormat = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
})

export function describeTime(event: Pick<SchedulerEvent, 'start' | 'end' | 'allDay'>): string {
    if (event.allDay) return dateFormat.format(event.start.toDate())
    return `${timeFormat.format(event.start.toDate())} to ${timeFormat.format(event.end.toDate())}`
}

export function describeMutation(mutation: Mutation): string {
    const event = mutation.after ?? mutation.before
    if (!event) return mutation.kind
    return `${event.title}, ${describeTime(event)}`
}

export const MUTATION_COLORS = {
    create: 'success',
    update: 'info',
    move: 'primary',
    resize: 'tertiary',
    delete: 'error'
} as const

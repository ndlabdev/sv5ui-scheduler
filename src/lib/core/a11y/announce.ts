import type { SchedulerEvent } from '../../types/event.types.js'
import type { SchedulerLabels } from '../../types/labels.types.js'
import type { Mutation } from '../../types/mutation.types.js'
import { formatTime } from '../time/format.js'

export interface AnnounceContext {
    readonly labels: SchedulerLabels
    readonly locale: string
    readonly hour12?: boolean
}

type Announcer = <T>(mutation: Mutation<T>, context: AnnounceContext) => string | null

const ANNOUNCERS: Record<Mutation['kind'], Announcer> = {
    create: (mutation, { labels }) =>
        mutation.after ? labels.announce.created(mutation.after) : null,
    delete: (mutation, { labels }) =>
        mutation.before ? labels.announce.deleted(mutation.before) : null,
    move: (mutation, context) =>
        mutation.after
            ? context.labels.announce.moved(mutation.after, time(mutation.after.start, context))
            : null,
    update: (mutation, context) =>
        mutation.after
            ? context.labels.announce.moved(mutation.after, time(mutation.after.start, context))
            : null,
    resize: (mutation, context) =>
        mutation.after
            ? context.labels.announce.resized(mutation.after, time(mutation.after.end, context))
            : null
}

export function announceMutation<T>(
    mutation: Mutation<T>,
    context: AnnounceContext
): string | null {
    return ANNOUNCERS[mutation.kind](mutation, context)
}

export function announceReverted<T>(event: SchedulerEvent<T>, context: AnnounceContext): string {
    return context.labels.announce.reverted(event)
}

export function announceConflict<T>(event: SchedulerEvent<T>, context: AnnounceContext): string {
    return context.labels.announce.conflict(event)
}

export function describeEvent<T>(event: SchedulerEvent<T>, context: AnnounceContext): string {
    return context.labels.event(event, time(event.start, context), time(event.end, context))
}

function time(date: Parameters<typeof formatTime>[0], context: AnnounceContext): string {
    return formatTime(date, context.locale, context.hour12)
}

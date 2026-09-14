import type { SchedulerLabels } from '../../types/labels.types.js'
import { en } from '../../locales/en.js'

export type PartialLabels = Partial<Omit<SchedulerLabels, 'announce'>> & {
    announce?: Partial<SchedulerLabels['announce']>
}

export const defaultLabels: SchedulerLabels = en

export function mergeLabels(overrides: PartialLabels | undefined): SchedulerLabels {
    if (!overrides) return defaultLabels
    const { announce, ...rest } = overrides
    return {
        ...defaultLabels,
        ...rest,
        announce: { ...defaultLabels.announce, ...announce }
    }
}

export function viewLabel(labels: SchedulerLabels, view: string): string {
    const known: Record<string, string> = {
        month: labels.month,
        week: labels.week,
        day: labels.day,
        agenda: labels.agenda,
        year: labels.year
    }
    return known[view] ?? view
}

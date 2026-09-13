import { parseZonedDateTime } from '@internationalized/date'
import { describe, expect, it } from 'vitest'
import type { SchedulerEvent } from '../../types/event.types.js'
import type { Mutation } from '../../types/mutation.types.js'
import { defaultLabels } from '../i18n/labels.js'
import { vi } from '../i18n/locales/vi.js'
import { announceConflict, announceMutation, announceReverted, describeEvent } from './announce.js'

const at = (iso: string) => parseZonedDateTime(`${iso}[UTC]`)
const event: SchedulerEvent = {
    id: 'a',
    title: 'Standup',
    start: at('2026-09-09T09:00'),
    end: at('2026-09-09T09:30')
}
const context = { labels: defaultLabels, locale: 'en-US' }
const mutation = (kind: Mutation['kind'], after: SchedulerEvent | null = event): Mutation => ({
    id: 'm1',
    kind,
    eventId: 'a',
    before: kind === 'create' ? null : event,
    after
})

describe('announceMutation', () => {
    it('names what happened and to which event', () => {
        expect(announceMutation(mutation('create'), context)).toBe('Created Standup')
        expect(announceMutation(mutation('delete', null), context)).toBe('Deleted Standup')
    })

    it('gives the new start when moved and the new end when resized', () => {
        expect(announceMutation(mutation('move'), context)).toBe('Moved Standup to 9:00 AM')
        expect(announceMutation(mutation('resize'), context)).toBe('Standup now ends at 9:30 AM')
    })

    it('follows the locale and the clock setting', () => {
        expect(announceMutation(mutation('move'), { labels: vi, locale: 'vi-VN' })).toBe(
            'Đã chuyển Standup sang 9:00'
        )
        expect(announceMutation(mutation('move'), { ...context, hour12: false })).toBe(
            'Moved Standup to 09:00'
        )
    })

    it('says nothing when the mutation has no event to talk about', () => {
        expect(announceMutation(mutation('create', null), context)).toBeNull()
    })
})

describe('other announcements', () => {
    it('reports a rollback and a conflict', () => {
        expect(announceReverted(event, context)).toContain('Standup')
        expect(announceConflict(event, context)).toContain('Standup')
    })

    it('describes an event with its times', () => {
        expect(describeEvent(event, context)).toBe('Standup, 9:00 AM to 9:30 AM')
    })
})

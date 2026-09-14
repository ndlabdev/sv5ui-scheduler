import { describe, expect, it } from 'vitest'
import { LiveAnnouncer } from './live-announcer.svelte.js'

describe('LiveAnnouncer', () => {
    it('changes the message text even when the same sentence is announced twice', () => {
        const announcer = new LiveAnnouncer()
        expect(announcer.message).toBe('')
        announcer.announce('Moved standup')
        const first = announcer.message
        announcer.announce('Moved standup')
        expect(announcer.message).not.toBe(first)
        expect(announcer.message.trim()).toBe('Moved standup')
        announcer.announce('Deleted standup')
        expect(announcer.message.trim()).toBe('Deleted standup')
    })
})

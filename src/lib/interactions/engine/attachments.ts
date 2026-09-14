import { untrack } from 'svelte'
import type { Attachment } from 'svelte/attachments'

export function composeAttachments(
    attachments: readonly Attachment<HTMLElement>[]
): Attachment<HTMLElement> {
    return (node) => {
        const cleanups = untrack(() => attachments.map((attach) => attach(node)))
        return () => {
            for (const cleanup of cleanups) cleanup?.()
        }
    }
}

<script lang="ts">
    import { Badge, Button, Empty, ScrollArea } from 'sv5ui'
    import type { EventLog } from './log.svelte.js'

    interface Props {
        log: EventLog
        title?: string
        empty?: string
    }

    let {
        log,
        title = 'Activity',
        empty = 'Interact with the calendar to see what it reports.'
    }: Props = $props()
</script>

<div
    class="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-outline-variant/60 bg-surface-container-lowest"
>
    <div class="flex items-center justify-between border-b border-outline-variant/60 px-4 py-2.5">
        <span class="text-sm font-semibold text-on-surface">{title}</span>
        <Button
            variant="ghost"
            color="surface"
            size="xs"
            label="Clear"
            disabled={log.entries.length === 0}
            onclick={() => log.clear()}
        />
    </div>
    {#if log.entries.length === 0}
        <div class="flex flex-1 items-center justify-center p-4">
            <Empty icon="lucide:activity" description={empty} />
        </div>
    {:else}
        <ScrollArea class="min-h-0 flex-1">
            <ol class="divide-y divide-outline-variant/40">
                {#each log.entries as entry (entry.id)}
                    <li class="flex items-start gap-3 px-4 py-2.5">
                        <Badge
                            label={entry.label}
                            color={entry.color}
                            variant="soft"
                            size="sm"
                            class="mt-0.5 shrink-0"
                        />
                        <div class="min-w-0 flex-1">
                            {#if entry.detail}
                                <p class="text-sm break-words text-on-surface">{entry.detail}</p>
                            {/if}
                            <p class="font-mono text-[11px] text-on-surface-variant">
                                {entry.time}
                            </p>
                        </div>
                    </li>
                {/each}
            </ol>
        </ScrollArea>
    {/if}
</div>

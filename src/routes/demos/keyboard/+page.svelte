<script lang="ts">
    import { Card, Kbd } from 'sv5ui'
    import { Scheduler, type EventInput } from '$lib/index.js'
    import DemoCard from '../../../demo/DemoCard.svelte'
    import LogPanel from '../../../demo/LogPanel.svelte'
    import PageHeader from '../../../demo/PageHeader.svelte'
    import { EventLog } from '../../../demo/log.svelte.js'
    import { calendars, teamEvents, timeZone } from '../../../demo/data.js'

    let events = $state<EventInput[]>(teamEvents())
    let ref = $state<HTMLElement | null>(null)
    const log = new EventLog()

    const keys = [
        {
            keys: ['Tab'],
            action: 'Move focus into the grid. The focused slot starts at nine today.'
        },
        {
            keys: ['Left', 'Right'],
            action: 'Previous or next day. Past the edge, the view steps a period.'
        },
        {
            keys: ['Up', 'Down'],
            action: 'Previous or next slot. In the month grid, previous or next week.'
        },
        {
            keys: ['Home', 'End'],
            action: 'First or last slot of the day, or the start or end of the week.'
        },
        {
            keys: ['PgUp', 'PgDn'],
            action: 'Previous or next period, keeping the focused position.'
        },
        { keys: ['Enter'], action: 'Create an event at the focused slot.' },
        { keys: ['Esc'], action: 'Cancel the drag in progress, or clear the selection.' },
        { keys: ['Delete'], action: 'Delete the selected event.' }
    ]

    $effect(() => {
        const region = ref?.querySelector('[aria-live]')
        if (!region) return
        const observer = new MutationObserver(() => {
            const text = region.textContent?.trim()
            if (text) log.add('announced', text, 'primary')
        })
        observer.observe(region, { childList: true, characterData: true, subtree: true })
        return () => observer.disconnect()
    })

    const code = '<Scheduler bind:events />'
</script>

<div class="mx-auto max-w-[1600px] space-y-10 px-4 py-8 sm:px-6 lg:px-8">
    <PageHeader
        icon="lucide:keyboard"
        badge="Interaction"
        title="Keyboard"
        description="Everything you can do with a pointer works from the keyboard. Each move is announced to screen readers, and the log on the right shows exactly what they hear."
    />

    <Card variant="outline">
        <div class="grid gap-x-10 gap-y-4 md:grid-cols-2">
            {#each keys as row (row.action)}
                <div class="flex items-start gap-4">
                    <div class="flex w-28 shrink-0 flex-wrap gap-1">
                        {#each row.keys as key (key)}
                            <Kbd value={key} />
                        {/each}
                    </div>
                    <p class="text-sm text-on-surface-variant">{row.action}</p>
                </div>
            {/each}
        </div>
    </Card>

    <DemoCard
        title="Try it"
        description="Click into the grid or press Tab until it is focused, then use the keys above."
        {code}
        height="h-[680px]"
    >
        {#snippet aside()}
            <LogPanel
                {log}
                title="Screen reader announcements"
                empty="Focus the grid and move around to hear what is announced."
            />
        {/snippet}
        <Scheduler bind:events bind:ref {timeZone} {calendars} class="h-full" />
    </DemoCard>
</div>

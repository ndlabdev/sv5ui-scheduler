<script lang="ts">
    import { Badge, Button, FormField, Icon, Switch, ToggleGroup } from 'sv5ui'
    import {
        Scheduler,
        type EventInput,
        type SchedulerEvent,
        type SidebarSnippetProps
    } from '$lib/index.js'
    import DemoCard from '../../../demo/DemoCard.svelte'
    import PageHeader from '../../../demo/PageHeader.svelte'
    import { calendars, dragSources, teamEvents, timeZone } from '../../../demo/data.js'
    import { describeTime } from '../../../demo/format.js'

    let events = $state<EventInput[]>(teamEvents())
    let customEvents = $state<EventInput[]>(teamEvents())
    let side = $state('start')
    let open = $state(true)

    const sideItems = [
        { label: 'Start', value: 'start', icon: 'lucide:panel-left' },
        { label: 'End', value: 'end', icon: 'lucide:panel-right' }
    ]

    function upcoming(list: SchedulerEvent[], from: SidebarSnippetProps['date']) {
        return list
            .filter(
                (event) => !event.background && !event.recurrence && event.end.compare(from) > 0
            )
            .toSorted((a, b) => a.start.compare(b.start))
            .slice(0, 6)
    }

    const code = $derived(`<Scheduler
    bind:events
    bind:sidebarOpen
    sidebar
    sidebarSide="${side}"
    {calendars}
    {dragSources}
>
    {#snippet sidebarHeader()}
        <Button label="New event" icon="lucide:plus" />
    {/snippet}
    {#snippet sidebarFooter()}
        <p>Synced a moment ago</p>
    {/snippet}
</Scheduler>`)
</script>

{#snippet header()}
    <Button label="New event" icon="lucide:plus" class="w-full justify-center" />
{/snippet}

{#snippet footer()}
    <div
        class="flex items-center gap-2 rounded-lg bg-surface-container-low px-3 py-2 text-xs text-on-surface-variant"
    >
        <Icon name="lucide:cloud-check" size="14" class="text-success" />
        Synced a moment ago
    </div>
{/snippet}

{#snippet agenda({ date, events: all, navigate, docked, close }: SidebarSnippetProps)}
    <div class="flex h-full flex-col gap-4 p-4">
        <div class="flex items-center justify-between">
            <h3 class="font-semibold text-on-surface">Up next</h3>
            {#if !docked}
                <Button
                    icon="lucide:x"
                    variant="ghost"
                    color="surface"
                    size="xs"
                    square
                    aria-label="Close"
                    onclick={close}
                />
            {/if}
        </div>
        <ul class="space-y-2">
            {#each upcoming(all, date) as event (event.id)}
                <li>
                    <button
                        type="button"
                        class="w-full rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-3 text-start transition-colors hover:border-primary/50"
                        onclick={() => navigate(event.start, 'day')}
                    >
                        <span class="block truncate text-sm font-medium text-on-surface"
                            >{event.title}</span
                        >
                        <span class="block text-xs text-on-surface-variant"
                            >{describeTime(event)}</span
                        >
                    </button>
                </li>
            {:else}
                <li class="text-sm text-on-surface-variant">Nothing ahead in this range.</li>
            {/each}
        </ul>
        <Badge
            label="{all.length} events in total"
            variant="soft"
            color="surface"
            class="mt-auto self-start"
        />
    </div>
{/snippet}

<div class="mx-auto max-w-[1600px] space-y-10 px-4 py-8 sm:px-6 lg:px-8">
    <PageHeader
        icon="lucide:panel-left"
        badge="Components"
        title="Sidebar"
        description="Set sidebar and the scheduler gains a panel with a date navigator, search, calendars and drag sources, plus a toolbar button to show and hide it. Below its breakpoint the panel opens as a slide-over."
    />

    <DemoCard
        title="The built-in sidebar"
        description="Add content above and below it with sidebarHeader and sidebarFooter, dock it to either side and bind whether it is open."
        {code}
        height="h-[720px]"
    >
        {#snippet controls()}
            <FormField label="Side">
                <ToggleGroup items={sideItems} bind:value={side} size="sm" variant="outline" />
            </FormField>
            <FormField label="Open">
                <Switch bind:checked={open} />
            </FormField>
        {/snippet}
        <Scheduler
            bind:events
            bind:sidebarOpen={open}
            {timeZone}
            {calendars}
            {dragSources}
            sidebar
            sidebarSide={side === 'end' ? 'end' : 'start'}
            sidebarHeader={header}
            sidebarFooter={footer}
            class="h-full"
        />
    </DemoCard>

    <DemoCard
        title="A sidebar of your own"
        description="Pass a snippet instead of true. It receives the visible range, every event, and a navigate function, and keeps the same docking and slide-over behaviour."
        height="h-[640px]"
    >
        <Scheduler
            bind:events={customEvents}
            {timeZone}
            {calendars}
            sidebar={agenda}
            class="h-full"
        />
    </DemoCard>
</div>

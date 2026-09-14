<script lang="ts">
    import { Button, Card, Icon, toast } from 'sv5ui'
    import { Scheduler, type EventInput, type Mutation } from '$lib/index.js'
    import DemoCard from '../../../demo/DemoCard.svelte'
    import PageHeader from '../../../demo/PageHeader.svelte'
    import {
        businessHours,
        calendars,
        dragSources,
        holidays,
        teamEvents,
        timeAt,
        timeZone,
        todayOffset
    } from '../../../demo/data.js'
    import { MUTATION_COLORS, describeMutation } from '../../../demo/format.js'

    let events = $state<EventInput[]>(teamEvents())
    let view = $state('week')
    let hiddenCalendars = $state<string[]>([])
    let search = $state('')
    let created = 0

    const hiddenCount = $derived(
        events.filter((event) => hiddenCalendars.includes(event.calendarId ?? '')).length
    )

    const stats = $derived([
        { label: 'Events', value: String(events.length), icon: 'lucide:calendar-check' },
        { label: 'Hidden by filters', value: String(hiddenCount), icon: 'lucide:eye-off' },
        { label: 'Active view', value: view, icon: 'lucide:layout-grid' }
    ])

    function addEvent() {
        created += 1
        const hour = String(8 + (created % 10)).padStart(2, '0')
        events.push({
            id: `quick-${created}`,
            title: `Quick event ${created}`,
            calendarId: 'work',
            start: timeAt(todayOffset, `${hour}:00`),
            end: timeAt(todayOffset, `${hour}:45`)
        })
        toast('Event added for today', { color: 'success', icon: 'lucide:calendar-plus' })
    }

    function reset() {
        events = teamEvents()
        hiddenCalendars = []
        search = ''
        toast('Calendar reset', { color: 'info', icon: 'lucide:rotate-ccw' })
    }

    function onMutate(mutation: Mutation) {
        toast(describeMutation(mutation), {
            color: MUTATION_COLORS[mutation.kind],
            description: `A ${mutation.kind} was saved`
        })
    }

    const code = `<Scheduler
    bind:events
    bind:view
    bind:hiddenCalendars
    bind:search
    {calendars}
    {dragSources}
    {holidays}
    businessHours={{ start: '09:00', end: '18:00', days: [1, 2, 3, 4, 5] }}
    weekNumbers
    sidebar
    {onMutate}
>
    {#snippet sidebarHeader()}
        <Button label="New event" icon="lucide:plus" onclick={addEvent} />
    {/snippet}
</Scheduler>`
</script>

<div class="mx-auto max-w-[1600px] space-y-8 px-4 py-8 sm:px-6 lg:px-8">
    <PageHeader
        icon="lucide:layout-dashboard"
        badge="Get started"
        title="Playground"
        description="Everything together: calendars you can hide, a search box, items to drag onto the grid, business hours, holidays and week numbers. Every change you make is written back into the bound array."
    >
        {#snippet actions()}
            <Button label="Add event" icon="lucide:plus" onclick={addEvent} />
            <Button
                label="Reset"
                icon="lucide:rotate-ccw"
                variant="outline"
                color="surface"
                onclick={reset}
            />
        {/snippet}
    </PageHeader>

    <div class="grid gap-4 sm:grid-cols-3">
        {#each stats as stat (stat.label)}
            <Card variant="soft">
                <div class="flex items-center gap-3">
                    <span
                        class="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"
                    >
                        <Icon name={stat.icon} size="20" />
                    </span>
                    <div>
                        <p class="text-xs text-on-surface-variant">{stat.label}</p>
                        <p class="text-xl font-semibold text-on-surface capitalize">{stat.value}</p>
                    </div>
                </div>
            </Card>
        {/each}
    </div>

    <DemoCard
        title="A calendar app in one component"
        description="Drag on empty slots to create, drag events to move them, pull their edges to resize, and drop items from the sidebar list. Narrow the window to see the sidebar turn into a slide-over."
        {code}
        height="h-[780px]"
    >
        <Scheduler
            bind:events
            bind:view
            bind:hiddenCalendars
            bind:search
            {timeZone}
            {calendars}
            {dragSources}
            {holidays}
            {businessHours}
            weekNumbers
            sidebar
            {onMutate}
            class="h-full"
        >
            {#snippet sidebarHeader()}
                <Button
                    label="New event"
                    icon="lucide:plus"
                    class="w-full justify-center"
                    onclick={addEvent}
                />
            {/snippet}
        </Scheduler>
    </DemoCard>
</div>

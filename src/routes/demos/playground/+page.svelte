<script lang="ts">
    import { Button, Card, Icon, toast } from 'sv5ui'
    import { Scheduler, type EventInput, type Mutation, type SlotSelection } from '$lib/index.js'
    import DemoCard from '../../../demo/DemoCard.svelte'
    import PageHeader from '../../../demo/PageHeader.svelte'
    import {
        businessHours,
        calendars,
        dragSources,
        holidays,
        teamEvents,
        timeZone
    } from '../../../demo/data.js'
    import { MUTATION_COLORS, describeMutation, describeTime } from '../../../demo/format.js'

    let events = $state<EventInput[]>(teamEvents())
    let view = $state('week')
    let hiddenCalendars = $state<string[]>([])
    let search = $state('')

    const hiddenCount = $derived(
        events.filter((event) => hiddenCalendars.includes(event.calendarId ?? '')).length
    )

    const stats = $derived([
        { label: 'Events', value: String(events.length), icon: 'lucide:calendar-check' },
        { label: 'Hidden by filters', value: String(hiddenCount), icon: 'lucide:eye-off' },
        { label: 'Active view', value: view, icon: 'lucide:layout-grid' }
    ])

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

    function onSelectSlot(selection: SlotSelection) {
        toast('Slot picked', {
            color: 'info',
            icon: 'lucide:mouse-pointer-click',
            description: describeTime(selection)
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
    {onSelectSlot}
    creatable={false}
    height={780}
/>`
</script>

<div class="mx-auto max-w-[1600px] space-y-8 px-4 py-8 sm:px-6 lg:px-8">
    <PageHeader
        icon="lucide:layout-dashboard"
        badge="Get started"
        title="Playground"
        description="Everything together: calendars you can hide, a search box, items to drag onto the grid, business hours, holidays and week numbers. Every change you make is written back into the bound array, and clicking an empty slot reports it so an app can open its own form."
    >
        {#snippet actions()}
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
        description="Drag events to move them, pull their edges to resize, and drop items from the sidebar list onto the grid. Narrow the window to see the sidebar turn into a slide-over."
        {code}
        height="h-auto"
    >
        <Scheduler
            creatable={false}
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
            {onSelectSlot}
            height={780}
        />
    </DemoCard>
</div>

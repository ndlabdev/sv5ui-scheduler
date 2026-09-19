<script lang="ts">
    import { now, type ZonedDateTime } from '@internationalized/date'
    import { Card } from 'sv5ui'
    import {
        CalendarList,
        DateNavigator,
        DragSourceList,
        EventChip,
        Scheduler,
        SearchBox,
        type EventColor,
        type EventInput,
        type SchedulerEvent
    } from '$lib/index.js'
    import CodeBlock from '../../../demo/CodeBlock.svelte'
    import PageHeader from '../../../demo/PageHeader.svelte'
    import { calendars, dragSources, teamEvents, timeZone } from '../../../demo/data.js'

    let events = $state<EventInput[]>(teamEvents())
    let planned = $state<EventInput[]>([])
    let picked = $state<ZonedDateTime>(now(timeZone))
    let hiddenCalendars = $state<string[]>(['personal'])
    let search = $state('')

    const pickedLabel = $derived(
        new Intl.DateTimeFormat('en-US', { dateStyle: 'full' }).format(picked.toDate())
    )

    const colors: EventColor[] = [
        'primary',
        'secondary',
        'tertiary',
        'success',
        'warning',
        'error',
        'info',
        'surface'
    ]
    const base = now(timeZone).set({ hour: 9, minute: 0, second: 0, millisecond: 0 })
    const sample = (color: EventColor): SchedulerEvent => ({
        id: color,
        title: color[0].toUpperCase() + color.slice(1),
        start: base,
        end: base.add({ minutes: 45 })
    })

    const navigatorCode =
        '<DateNavigator date={picked} onSelect={(date) => (picked = date)} {events} />'
    const filterCode = `<SearchBox bind:value={search} />
<CalendarList {calendars} bind:hiddenCalendars />
<Scheduler bind:events {calendars} {hiddenCalendars} {search} view="agenda" />`
    const dragCode = `<DragSourceList items={dragSources} {calendars} />
<Scheduler bind:events view="day" />`
    const chipCode = '<EventChip {event} color="success" variant="solid" />'
</script>

<div class="mx-auto max-w-[1600px] space-y-10 px-4 py-8 sm:px-6 lg:px-8">
    <PageHeader
        icon="lucide:blocks"
        badge="Components"
        title="Building blocks"
        description="The parts of the built-in sidebar are exported on their own, so you can place them anywhere in your layout and wire them to one or more schedulers."
    />

    <div class="grid gap-6 xl:grid-cols-3">
        <section class="space-y-3">
            <h2 class="text-lg font-semibold text-on-surface">DateNavigator</h2>
            <p class="text-sm text-on-surface-variant">
                A month calendar with a dot under every day that has events.
            </p>
            <Card variant="outline">
                <div class="space-y-4">
                    <DateNavigator
                        date={picked}
                        onSelect={(date) => (picked = date)}
                        {events}
                        {timeZone}
                    />
                    <p class="text-sm text-on-surface">
                        Selected: <span class="font-medium">{pickedLabel}</span>
                    </p>
                </div>
            </Card>
            <CodeBlock code={navigatorCode} />
        </section>

        <section class="space-y-3 xl:col-span-2">
            <h2 class="text-lg font-semibold text-on-surface">SearchBox and CalendarList</h2>
            <p class="text-sm text-on-surface-variant">
                Bound to the same state as the scheduler. Press / to focus the search box.
            </p>
            <Card variant="outline">
                <div class="grid gap-4 md:grid-cols-[16rem_minmax(0,1fr)]">
                    <div class="space-y-4">
                        <SearchBox bind:value={search} />
                        <CalendarList {calendars} bind:hiddenCalendars />
                    </div>
                    <div
                        class="h-[420px] overflow-hidden rounded-xl border border-outline-variant/60"
                    >
                        <Scheduler
                            creatable={false}
                            bind:events
                            {timeZone}
                            {calendars}
                            {hiddenCalendars}
                            {search}
                            view="agenda"
                            class="h-full"
                        />
                    </div>
                </div>
            </Card>
            <CodeBlock code={filterCode} />
        </section>
    </div>

    <div class="grid gap-6 xl:grid-cols-2">
        <section class="space-y-3">
            <h2 class="text-lg font-semibold text-on-surface">DragSourceList</h2>
            <p class="text-sm text-on-surface-variant">
                Items coloured by their calendar. Drag one onto the day view.
            </p>
            <Card variant="outline">
                <div class="grid gap-4 md:grid-cols-[14rem_minmax(0,1fr)]">
                    <DragSourceList items={dragSources} {calendars} />
                    <div
                        class="h-[460px] overflow-hidden rounded-xl border border-outline-variant/60"
                    >
                        <Scheduler
                            bind:events={planned}
                            {timeZone}
                            {calendars}
                            view="day"
                            creatable={false}
                            class="h-full"
                        />
                    </div>
                </div>
            </Card>
            <CodeBlock code={dragCode} />
        </section>

        <section class="space-y-3">
            <h2 class="text-lg font-semibold text-on-surface">EventChip</h2>
            <p class="text-sm text-on-surface-variant">
                The default event renderer, in every colour and both variants.
            </p>
            <Card variant="outline">
                <div class="grid gap-3 sm:grid-cols-2">
                    {#each colors as color (color)}
                        <div class="space-y-2">
                            <div class="h-14">
                                <EventChip
                                    event={sample(color)}
                                    {color}
                                    variant="solid"
                                    size="sm"
                                    class="h-full"
                                />
                            </div>
                            <div class="h-14">
                                <EventChip event={sample(color)} {color} class="h-full" />
                            </div>
                        </div>
                    {/each}
                </div>
            </Card>
            <CodeBlock code={chipCode} />
        </section>
    </div>
</div>

<script lang="ts">
    import { parseZonedDateTime, type ZonedDateTime } from '@internationalized/date'
    import { Badge, Button, FormField, Select } from 'sv5ui'
    import { Scheduler, type EventInput, type Mutation } from '$lib/index.js'
    import DemoCard from '../../../demo/DemoCard.svelte'
    import LogPanel from '../../../demo/LogPanel.svelte'
    import PageHeader from '../../../demo/PageHeader.svelte'
    import { EventLog } from '../../../demo/log.svelte.js'

    const zones = [
        { label: 'New York', value: 'America/New_York' },
        { label: 'London', value: 'Europe/London' },
        { label: 'Ho Chi Minh City', value: 'Asia/Ho_Chi_Minh' },
        { label: 'Sydney', value: 'Australia/Sydney' },
        { label: 'UTC', value: 'UTC' }
    ]

    const transitions = [
        { label: 'US clocks go forward', date: '2026-03-08', zone: 'America/New_York' },
        { label: 'UK clocks go forward', date: '2026-03-29', zone: 'Europe/London' },
        { label: 'Sydney clocks go back', date: '2026-04-05', zone: 'Australia/Sydney' },
        { label: 'UK clocks go back', date: '2026-10-25', zone: 'Europe/London' },
        { label: 'US clocks go back', date: '2026-11-01', zone: 'America/New_York' }
    ]

    const at = (value: string) => parseZonedDateTime(value)

    let events = $state<EventInput[]>([
        {
            id: 'sync',
            title: 'Global sync',
            start: at('2026-02-02T10:00[America/New_York]'),
            end: at('2026-02-02T11:00[America/New_York]'),
            recurrence: { freq: 'weekly', byDay: [1] },
            color: 'primary'
        },
        {
            id: 'night',
            title: 'Night shift',
            start: at('2026-03-08T00:00[America/New_York]'),
            end: at('2026-03-08T06:00[America/New_York]'),
            color: 'tertiary'
        },
        {
            id: 'london',
            title: 'London office hours',
            start: at('2026-03-02T09:00[Europe/London]'),
            end: at('2026-03-02T12:00[Europe/London]'),
            recurrence: { freq: 'weekly', byDay: [2, 4] },
            color: 'success'
        },
        {
            id: 'sydney',
            title: 'Sydney standup',
            start: at('2026-03-02T09:00[Australia/Sydney]'),
            end: at('2026-03-02T09:30[Australia/Sydney]'),
            recurrence: { freq: 'weekly', byDay: [1, 2, 3, 4, 5] },
            color: 'warning'
        },
        {
            id: 'fallback',
            title: 'Overnight deploy',
            start: at('2026-11-01T00:30[America/New_York]'),
            end: at('2026-11-01T03:30[America/New_York]'),
            color: 'error'
        }
    ])

    let left = $state('America/New_York')
    let right = $state('Europe/London')
    let date = $state<ZonedDateTime>(at('2026-03-08T12:00[America/New_York]'))
    const log = new EventLog()

    function onMutate(mutation: Mutation) {
        const event = mutation.after ?? mutation.before
        if (!event) return
        log.add(
            `${mutation.kind}: ${event.title}`,
            `toAbsoluteString() ${event.start.toAbsoluteString()}`,
            'info'
        )
        log.add('same instant with its zone', `toString() ${event.start.toString()}`, 'surface')
    }

    function jump(transition: (typeof transitions)[number]) {
        date = at(`${transition.date}T12:00[${transition.zone}]`)
        left = transition.zone
    }

    const code = `<Scheduler
    bind:events
    bind:date
    timeZone="America/New_York"
    onMutate={(mutation) => api.save({
        ...mutation.after,
        start: mutation.after.start.toAbsoluteString(),
        end: mutation.after.end.toAbsoluteString()
    })}
/>
<Scheduler
    bind:events
    bind:date
    timeZone="Europe/London"
/>`
</script>

<div class="mx-auto max-w-[1600px] space-y-10 px-4 py-8 sm:px-6 lg:px-8">
    <PageHeader
        icon="lucide:globe"
        badge="Localization"
        title="Time zones"
        description="Every date is a zoned date. Give the scheduler a time zone and it shows the same instants in that zone, with correct lengths on the days clocks change."
    />

    <DemoCard
        title="Two zones, one set of events"
        description="Both schedulers share the events and the date; each names its zone above the hour gutter. Pick another zone and every event moves to its new wall clock time. Move an event and the log shows what your API would receive: a UTC instant from toAbsoluteString, or the same instant with its zone from toString."
        {code}
        height="h-[700px]"
    >
        {#snippet controls()}
            <FormField label="Left" class="w-48">
                <Select items={zones} bind:value={left} />
            </FormField>
            <FormField label="Right" class="w-48">
                <Select items={zones} bind:value={right} />
            </FormField>
            <div class="flex flex-wrap items-center gap-2">
                {#each transitions as transition (transition.date + transition.zone)}
                    <Button
                        label={transition.label}
                        size="sm"
                        variant="soft"
                        color="surface"
                        icon="lucide:clock"
                        onclick={() => jump(transition)}
                    />
                {/each}
            </div>
        {/snippet}
        {#snippet aside()}
            <LogPanel {log} title="What your API receives" />
        {/snippet}
        <div class="grid h-full gap-4 lg:grid-cols-2">
            {#each [left, right] as zone, index (index)}
                <div class="flex min-h-0 flex-col gap-2">
                    <Badge
                        label={zones.find((item) => item.value === zone)?.label ?? zone}
                        leadingIcon="lucide:map-pin"
                        variant="soft"
                        color={index === 0 ? 'primary' : 'tertiary'}
                        class="self-start"
                    />
                    <div
                        class="min-h-0 flex-1 overflow-hidden rounded-xl border border-outline-variant/60"
                    >
                        <Scheduler
                            creatable={false}
                            bind:events
                            bind:date
                            timeZone={zone}
                            view="week"
                            {onMutate}
                            class="h-full"
                        />
                    </div>
                </div>
            {/each}
        </div>
    </DemoCard>
</div>

<script lang="ts">
    import { Badge, Card, FormField, Switch } from 'sv5ui'
    import { Scheduler, type EventColor, type EventInput } from '$lib/index.js'
    import DemoCard from '../../../demo/DemoCard.svelte'
    import PageHeader from '../../../demo/PageHeader.svelte'
    import { calendars, teamEvents, timeAt, timeZone, todayOffset } from '../../../demo/data.js'

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

    let palette = $state<EventInput[]>(
        colors.map((color, index) => ({
            id: color,
            title: color[0].toUpperCase() + color.slice(1),
            start: timeAt(todayOffset, `${String(8 + index).padStart(2, '0')}:00`),
            end: timeAt(todayOffset, `${String(8 + index).padStart(2, '0')}:50`),
            color
        }))
    )
    let events = $state<EventInput[]>(teamEvents())
    let framed = $state(true)
    let tintedToolbar = $state(true)

    const ui = $derived({
        root: framed ? 'rounded-2xl border border-outline-variant/60 overflow-hidden' : '',
        toolbar: tintedToolbar ? 'bg-surface-container-low' : ''
    })

    const code = $derived(`<Scheduler
    bind:events
    ui={{
        root: '${ui.root}',
        toolbar: '${ui.toolbar}'
    }}
/>`)
</script>

<div class="mx-auto max-w-[1600px] space-y-10 px-4 py-8 sm:px-6 lg:px-8">
    <PageHeader
        icon="lucide:palette"
        badge="Customization"
        title="Theming"
        description="The scheduler is drawn with sv5ui theme tokens, so it follows your theme and dark mode with no extra work. Use the theme button in the header to switch."
    />

    <div class="grid gap-10 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <DemoCard
            title="Colour roles"
            description="Each event colour maps to a token pair. Calendars set the colour of their events, and an event can override it."
            height="h-[640px]"
        >
            <Scheduler bind:events={palette} {timeZone} view="day" class="h-full" />
        </DemoCard>

        <div class="space-y-4">
            <h2 class="text-lg font-semibold text-on-surface">Calendar colours</h2>
            <Card variant="outline">
                <div class="flex flex-wrap gap-2">
                    {#each calendars as calendar (calendar.id)}
                        <Badge label={calendar.title} color={calendar.color} variant="soft" />
                    {/each}
                </div>
            </Card>
            <Card variant="soft">
                <div class="space-y-2 text-sm text-on-surface-variant">
                    <p>Order of precedence for an event's colour:</p>
                    <ol class="space-y-2 text-on-surface">
                        {#each ['The color set on the event', 'The color of its calendar', 'Primary'] as step, index (step)}
                            <li class="flex items-center gap-2">
                                <Badge
                                    label={String(index + 1)}
                                    color="primary"
                                    variant="soft"
                                    size="sm"
                                    square
                                />
                                {step}
                            </li>
                        {/each}
                    </ol>
                </div>
            </Card>
        </div>
    </div>

    <DemoCard
        title="Class overrides per slot"
        description="Every part of the scheduler has a named slot. Pass classes through ui to adjust spacing, borders or surfaces without forking a component."
        {code}
        height="h-[640px]"
    >
        {#snippet controls()}
            <FormField label="Framed">
                <Switch bind:checked={framed} />
            </FormField>
            <FormField label="Tinted toolbar">
                <Switch bind:checked={tintedToolbar} />
            </FormField>
        {/snippet}
        <Scheduler bind:events {timeZone} {calendars} view="month" {ui} class="h-full" />
    </DemoCard>
</div>

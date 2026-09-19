<script lang="ts">
    import { FormField, Select, Slider, Switch } from 'sv5ui'
    import { Scheduler, type EventInput, type WeekDay } from '$lib/index.js'
    import DemoCard from '../../../demo/DemoCard.svelte'
    import PageHeader from '../../../demo/PageHeader.svelte'
    import { calendars, teamEvents, timeZone } from '../../../demo/data.js'

    let events = $state<EventInput[]>(teamEvents())
    let view = $state('week')
    let span = $state('calendar')
    let slotMinutes = $state('30')
    let slotHeight = $state(24)
    let weekStartsOn = $state('1')
    let weekNumbers = $state(true)
    let startHour = $state('0')
    let endHour = $state('24')
    let hideWeekends = $state(false)

    let compactEvents = $state<EventInput[]>(teamEvents())

    const viewItems = [
        { label: 'Month', value: 'month' },
        { label: 'Week', value: 'week' },
        { label: 'Day', value: 'day' },
        { label: 'Year', value: 'year' },
        { label: 'Agenda', value: 'agenda' }
    ]

    const spanItems = [
        { label: 'Calendar week', value: 'calendar' },
        { label: '3 days', value: '3' },
        { label: '4 days', value: '4' },
        { label: '5 days', value: '5' },
        { label: '2 weeks', value: '14' }
    ]

    const slotItems = [
        { label: '15 minutes', value: '15' },
        { label: '30 minutes', value: '30' },
        { label: '1 hour', value: '60' }
    ]

    const startHourItems = ['0', '6', '7', '8'].map((value) => ({ label: `${value}:00`, value }))
    const endHourItems = ['18', '20', '22', '24'].map((value) => ({ label: `${value}:00`, value }))

    const startItems = [
        { label: 'Monday', value: '1' },
        { label: 'Sunday', value: '0' },
        { label: 'Saturday', value: '6' }
    ]

    const days = $derived(span === 'calendar' ? undefined : Number(span))
    const firstDay = $derived(Number(weekStartsOn) as WeekDay)

    const code = $derived(
        [
            '<Scheduler',
            '    bind:events',
            `    view="${view}"`,
            days ? `    days={${days}}` : null,
            `    slotMinutes={${slotMinutes}}`,
            `    slotHeight={${slotHeight}}`,
            `    weekStartsOn={${weekStartsOn}}`,
            weekNumbers ? '    weekNumbers' : null,
            startHour !== '0' ? `    dayStartHour={${startHour}}` : null,
            endHour !== '24' ? `    dayEndHour={${endHour}}` : null,
            hideWeekends ? '    hiddenDays={[0, 6]}' : null,
            '/>'
        ]
            .filter((line) => line !== null)
            .join('\n')
    )

    const compactCode = `<Scheduler
    bind:events
    view="agenda"
    toolbar={false}
/>`
</script>

<div class="mx-auto max-w-[1600px] space-y-10 px-4 py-8 sm:px-6 lg:px-8">
    <PageHeader
        icon="lucide:calendar-range"
        badge="Views"
        title="Views and ranges"
        description="Five built-in views share one engine. The week view shows any number of days when you set days, and the time grid follows the slot size you choose."
    />

    <DemoCard
        title="Configure the grid"
        description="Change the props below and watch the grid and the generated code follow. The days setting applies to the week view."
        {code}
        height="h-[720px]"
    >
        {#snippet controls()}
            <FormField label="View" class="w-40">
                <Select items={viewItems} bind:value={view} />
            </FormField>
            <FormField label="Days in a row" class="w-44">
                <Select items={spanItems} bind:value={span} />
            </FormField>
            <FormField label="Slot" class="w-40">
                <Select items={slotItems} bind:value={slotMinutes} />
            </FormField>
            <FormField label="Week starts on" class="w-40">
                <Select items={startItems} bind:value={weekStartsOn} />
            </FormField>
            <FormField label="Slot height: {slotHeight}px" class="w-48">
                <Slider bind:value={slotHeight} min={16} max={48} step={2} />
            </FormField>
            <FormField label="Week numbers">
                <Switch bind:checked={weekNumbers} />
            </FormField>
            <FormField label="Visible hours">
                <div class="flex items-center gap-2">
                    <Select items={startHourItems} bind:value={startHour} class="w-24" />
                    <Select items={endHourItems} bind:value={endHour} class="w-24" />
                </div>
            </FormField>
            <FormField label="Hide weekends">
                <Switch bind:checked={hideWeekends} />
            </FormField>
        {/snippet}
        <Scheduler
            creatable={false}
            bind:events
            bind:view
            {timeZone}
            {calendars}
            {days}
            slotMinutes={Number(slotMinutes)}
            {slotHeight}
            weekStartsOn={firstDay}
            {weekNumbers}
            dayStartHour={Number(startHour)}
            dayEndHour={Number(endHour)}
            hiddenDays={hideWeekends ? [0, 6] : []}
            class="h-full"
        />
    </DemoCard>

    <DemoCard
        title="Without the toolbar"
        description="Hide the toolbar when the surrounding page already provides navigation, for example an agenda in a narrow side panel."
        code={compactCode}
        height="h-[520px]"
    >
        <div class="mx-auto h-full max-w-md">
            <Scheduler
                creatable={false}
                bind:events={compactEvents}
                view="agenda"
                toolbar={false}
                {timeZone}
                {calendars}
                class="h-full"
            />
        </div>
    </DemoCard>
</div>

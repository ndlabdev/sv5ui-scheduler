<script lang="ts">
    import { FormField, Select, Switch, ToggleGroup } from 'sv5ui'
    import { Scheduler, type EventInput, type Holiday, type WeekDay } from '$lib/index.js'
    import DemoCard from '../../../demo/DemoCard.svelte'
    import PageHeader from '../../../demo/PageHeader.svelte'
    import { calendars, dayAt, teamEvents, timeAt, timeZone } from '../../../demo/data.js'

    let events = $state<EventInput[]>([
        ...teamEvents(),
        {
            id: 'maintenance',
            title: 'Maintenance window',
            start: timeAt(2, '06:00'),
            end: timeAt(2, '08:30'),
            background: true
        },
        {
            id: 'focus',
            title: 'No meetings',
            start: timeAt(4, '13:00'),
            end: timeAt(4, '17:00'),
            background: true
        }
    ])

    let open = $state('09:00')
    let close = $state('18:00')
    let workdays = $state(['1', '2', '3', '4', '5'])
    let showHolidays = $state(true)
    let weekNumbers = $state(true)
    let view = $state('week')

    const openItems = ['07:00', '08:00', '09:00', '10:00'].map((value) => ({ label: value, value }))
    const closeItems = ['16:00', '17:00', '18:00', '19:00', '20:00'].map((value) => ({
        label: value,
        value
    }))
    const dayItems = [
        { label: 'Mon', value: '1' },
        { label: 'Tue', value: '2' },
        { label: 'Wed', value: '3' },
        { label: 'Thu', value: '4' },
        { label: 'Fri', value: '5' },
        { label: 'Sat', value: '6' },
        { label: 'Sun', value: '0' }
    ]

    const holidayList: Holiday[] = [
        { date: dayAt(1), title: 'Founders day' },
        { date: dayAt(11), title: 'Company holiday' }
    ]

    const businessHours = $derived({
        start: open,
        end: close,
        days: workdays.map((day) => Number(day) as WeekDay)
    })
    const holidays = $derived(showHolidays ? holidayList : [])

    const code = $derived(`<Scheduler
    bind:events
    businessHours={{ start: '${open}', end: '${close}', days: [${workdays.join(', ')}] }}
    holidays={[
        { date: '${holidayList[0].date}', title: 'Founders day' },
        { date: '${holidayList[1].date}', title: 'Company holiday' }
    ]}${weekNumbers ? '\n    weekNumbers' : ''}
/>`)
</script>

<div class="mx-auto max-w-[1600px] space-y-10 px-4 py-8 sm:px-6 lg:px-8">
    <PageHeader
        icon="lucide:briefcase-business"
        badge="Views"
        title="Business hours"
        description="Shade the time outside working hours, mark holidays in every view and draw background events behind the rest. Holidays are always outside business hours."
    />

    <DemoCard
        title="Working week"
        description="Pick the opening hours and working days. The maintenance window and the afternoon without meetings are background events: they sit behind the grid and never take a column."
        {code}
        height="h-[760px]"
    >
        {#snippet controls()}
            <FormField label="Opens" class="w-32">
                <Select items={openItems} bind:value={open} />
            </FormField>
            <FormField label="Closes" class="w-32">
                <Select items={closeItems} bind:value={close} />
            </FormField>
            <FormField label="Working days">
                <ToggleGroup
                    type="multiple"
                    items={dayItems}
                    bind:value={workdays}
                    size="sm"
                    variant="outline"
                />
            </FormField>
            <FormField label="Holidays">
                <Switch bind:checked={showHolidays} />
            </FormField>
            <FormField label="Week numbers">
                <Switch bind:checked={weekNumbers} />
            </FormField>
        {/snippet}
        <Scheduler
            creatable={false}
            bind:events
            bind:view
            {timeZone}
            {calendars}
            {businessHours}
            {holidays}
            {weekNumbers}
            class="h-full"
        />
    </DemoCard>
</div>

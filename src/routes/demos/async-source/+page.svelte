<script lang="ts">
    import { FormField, Slider, Switch, toast } from 'sv5ui'
    import { Scheduler, type DateRange, type EventInput, type EventSourceFn } from '$lib/index.js'
    import DemoCard from '../../../demo/DemoCard.svelte'
    import LogPanel from '../../../demo/LogPanel.svelte'
    import PageHeader from '../../../demo/PageHeader.svelte'
    import { EventLog } from '../../../demo/log.svelte.js'
    import { calendars, timeZone } from '../../../demo/data.js'

    let latency = $state(900)
    let failNext = $state(false)
    let view = $state('week')
    const log = new EventLog()

    const titles = [
        'Client call',
        'Code review',
        'Interview',
        'Sales demo',
        'Workshop',
        'One on one',
        'Budget review',
        'Site visit'
    ]
    const calendarIds = ['work', 'team', 'personal', 'learning']
    const dayFormat = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })

    function describeRange(range: DateRange): string {
        const last = range.end.subtract({ days: 1 })
        return `${dayFormat.format(range.start.toDate())} to ${dayFormat.format(last.toDate())}`
    }

    function sleep(ms: number, signal: AbortSignal) {
        return new Promise<void>((resolve, reject) => {
            const timer = setTimeout(resolve, ms)
            signal.addEventListener(
                'abort',
                () => {
                    clearTimeout(timer)
                    reject(signal.reason)
                },
                { once: true }
            )
        })
    }

    function generate(range: DateRange): EventInput[] {
        const events: EventInput[] = []
        for (let day = range.start; day.compare(range.end) < 0; day = day.add({ days: 1 })) {
            const seed = day.day * 7 + day.month * 3
            const count = seed % 4
            for (let index = 0; index < count; index += 1) {
                const hour = 8 + ((seed + index * 5) % 9)
                const start = day.set({ hour, minute: index % 2 === 0 ? 0 : 30 })
                events.push({
                    id: `${day.toString().slice(0, 10)}-${index}`,
                    title: titles[(seed + index) % titles.length],
                    calendarId: calendarIds[(seed + index) % calendarIds.length],
                    start,
                    end: start.add({ minutes: 30 + ((seed + index) % 3) * 30 })
                })
            }
        }
        return events
    }

    const source: EventSourceFn = async ({ range, signal }) => {
        const label = describeRange(range)
        log.add('request', label, 'info')
        try {
            await sleep(latency, signal)
        } catch (error) {
            log.add('aborted', label, 'surface')
            throw error
        }
        if (failNext) {
            failNext = false
            log.add('failed', label, 'error')
            throw new Error('The network is unreachable')
        }
        const events = generate(range)
        log.add('loaded', `${events.length} events, ${label}`, 'success')
        return events
    }

    function onLoadError(error: unknown) {
        toast('Could not load events', {
            color: 'error',
            icon: 'lucide:wifi-off',
            description: error instanceof Error ? error.message : String(error)
        })
    }

    const code = `<Scheduler
    source={async ({ range, timeZone, signal }) => {
        const response = await fetch(
            '/api/events?from=' + range.start + '&to=' + range.end,
            { signal }
        )
        return response.json()
    }}
    onLoadError={(error) => toast.error(String(error))}
/>`
</script>

<div class="mx-auto max-w-[1600px] space-y-10 px-4 py-8 sm:px-6 lg:px-8">
    <PageHeader
        icon="lucide:cloud-download"
        badge="Data"
        title="Async source"
        description="Pass a function instead of an array and the scheduler asks it only for the range on screen. Ranges it already holds are not requested again, and a request that is no longer needed is aborted."
    />

    <DemoCard
        title="Lazy loading"
        description="Navigate forward and back. The first visit to a range shows a loading state; returning to it is instant. Navigate quickly to see stale requests aborted."
        {code}
        height="h-[720px]"
    >
        {#snippet controls()}
            <FormField label="Response time: {latency} ms" class="w-64">
                <Slider bind:value={latency} min={100} max={3000} step={100} />
            </FormField>
            <FormField label="Fail the next request">
                <Switch bind:checked={failNext} />
            </FormField>
        {/snippet}
        {#snippet aside()}
            <LogPanel {log} title="Network" />
        {/snippet}
        <Scheduler
            creatable={false}
            {source}
            {onLoadError}
            bind:view
            {timeZone}
            {calendars}
            class="h-full"
        />
    </DemoCard>
</div>

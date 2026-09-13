<script lang="ts">
    import { getLocalTimeZone, now } from '@internationalized/date'
    import { ThemeModeButton, ToggleGroup } from 'sv5ui'
    import { Scheduler, type EventInput, type Mutation } from '$lib/index.js'
    import { vi } from '$lib/locales.js'

    const timeZone = getLocalTimeZone()
    const today = now(timeZone).set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
    const day = (offset: number, time: string) =>
        today.add({ days: offset }).toString().slice(0, 10) + 'T' + time

    let events = $state<EventInput[]>([
        {
            id: 'standup',
            title: 'Daily standup',
            start: day(-7, '09:00'),
            end: day(-7, '09:30'),
            color: 'primary',
            recurrence: { freq: 'weekly', byDay: [1, 2, 3, 4, 5] }
        },
        {
            id: 'design',
            title: 'Design review',
            start: day(0, '10:00'),
            end: day(0, '11:30'),
            color: 'tertiary'
        },
        {
            id: 'pair',
            title: 'Pairing',
            start: day(0, '10:30'),
            end: day(0, '12:00'),
            color: 'secondary'
        },
        {
            id: 'lunch',
            title: 'Lunch',
            start: day(0, '12:00'),
            end: day(0, '13:00'),
            background: true
        },
        {
            id: 'ship',
            title: 'Ship v0.1',
            start: day(1, '14:00'),
            end: day(1, '16:00'),
            color: 'success'
        },
        {
            id: 'late',
            title: 'Late deploy',
            start: day(2, '23:00'),
            end: day(3, '01:00'),
            color: 'warning'
        },
        {
            id: 'offsite',
            title: 'Team offsite',
            start: day(3, '00:00'),
            end: day(5, '00:00'),
            allDay: true,
            color: 'info'
        },
        {
            id: 'trip',
            title: 'Client trip',
            start: day(-1, '09:00'),
            end: day(1, '18:00'),
            color: 'error'
        }
    ])
    let view = $state('week')
    let locale = $state('en-US')
    let log = $state<string[]>([])

    async function handleMutate(mutation: Mutation) {
        log = [`${mutation.kind} ${mutation.eventId}`, ...log].slice(0, 5)
    }
</script>

<main class="flex h-screen flex-col gap-3 bg-surface p-4 text-on-surface">
    <header class="flex items-center justify-between">
        <h1 class="text-lg font-semibold">@sv5ui/scheduler</h1>
        <div class="flex items-center gap-2">
            <ToggleGroup
                size="sm"
                bind:value={locale}
                items={[
                    { value: 'en-US', label: 'EN' },
                    { value: 'vi-VN', label: 'VI' }
                ]}
                aria-label="Locale"
            />
            <ThemeModeButton />
        </div>
    </header>
    <div class="min-h-0 flex-1 overflow-hidden rounded-lg border border-outline-variant">
        <Scheduler
            bind:events
            bind:view
            {timeZone}
            {locale}
            labels={locale === 'vi-VN' ? vi : undefined}
            weekStartsOn={1}
            businessHours={{ start: '09:00', end: '18:00', days: [1, 2, 3, 4, 5] }}
            hour12={locale === 'vi-VN' ? false : undefined}
            onMutate={handleMutate}
        />
    </div>
    {#if log.length}
        <ul class="text-xs text-on-surface-variant">
            {#each log as line (line)}<li>{line}</li>{/each}
        </ul>
    {/if}
</main>

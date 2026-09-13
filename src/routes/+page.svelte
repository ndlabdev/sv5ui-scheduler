<script lang="ts">
    import { getLocalTimeZone, now, type ZonedDateTime } from '@internationalized/date'
    import { Button, DropdownMenu, ThemeModeButton } from 'sv5ui'
    import {
        Scheduler,
        type DragSourceData,
        type EventInput,
        type SchedulerCalendar
    } from '$lib/index.js'
    import { vi } from '$lib/locales.js'

    const calendars: SchedulerCalendar[] = [
        { id: 'work', title: 'Work', color: 'primary' },
        { id: 'personal', title: 'Personal', color: 'success' },
        { id: 'birthdays', title: 'Birthdays', color: 'warning' },
        { id: 'holidays', title: 'Holidays', color: 'tertiary' },
        { id: 'side', title: 'Side Projects', color: 'surface' },
        { id: 'travel', title: 'Travel', color: 'error' },
        { id: 'team', title: 'Team', color: 'info' },
        { id: 'marketing', title: 'Marketing', color: 'secondary' }
    ]

    const dragSources: DragSourceData[] = [
        { title: 'Dentist', durationMinutes: 45, calendarId: 'personal' },
        { title: 'Sprint retro', durationMinutes: 90, calendarId: 'team' },
        { title: 'Call the bank', calendarId: 'work' }
    ]

    const timeZone = getLocalTimeZone()
    const today = now(timeZone).set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
    const dayOf = (offset: number) => today.add({ days: offset }).toString().slice(0, 10)
    const at = (offset: number, time: string) => `${dayOf(offset)}T${time}`

    let events = $state<EventInput[]>([
        {
            id: 'standup',
            title: 'Daily standup',
            calendarId: 'team',
            start: at(-14, '09:00'),
            end: at(-14, '09:30'),
            recurrence: { freq: 'weekly', byDay: [1, 2, 3, 4, 5] }
        },
        {
            id: 'review',
            title: 'Design review',
            calendarId: 'work',
            start: at(0, '10:00'),
            end: at(0, '11:30')
        },
        {
            id: 'pairing',
            title: 'Pairing session',
            calendarId: 'work',
            start: at(0, '10:30'),
            end: at(0, '12:00')
        },
        {
            id: 'lunch',
            title: 'Lunch',
            calendarId: 'personal',
            start: at(0, '12:00'),
            end: at(0, '13:00'),
            background: true
        },
        {
            id: 'dentist',
            title: 'Dentist appointment',
            calendarId: 'personal',
            start: at(1, '15:00'),
            end: at(1, '15:45')
        },
        {
            id: 'ship',
            title: 'Ship v0.1',
            calendarId: 'work',
            start: at(2, '14:00'),
            end: at(2, '16:00')
        },
        {
            id: 'deploy',
            title: 'Late deploy',
            calendarId: 'team',
            start: at(3, '23:00'),
            end: at(4, '01:00')
        },
        {
            id: 'offsite',
            title: 'Marketing offsite',
            calendarId: 'marketing',
            start: dayOf(4),
            end: dayOf(6),
            allDay: true
        },
        {
            id: 'trip',
            title: 'Client trip',
            calendarId: 'travel',
            start: at(-2, '09:00'),
            end: at(1, '18:00')
        },
        {
            id: 'birthday',
            title: 'Sarah birthday',
            calendarId: 'birthdays',
            start: dayOf(6),
            end: dayOf(7),
            allDay: true
        },
        {
            id: 'holiday',
            title: 'Family day',
            calendarId: 'holidays',
            start: dayOf(9),
            end: dayOf(10),
            allDay: true
        },
        {
            id: 'sprint',
            title: 'Sprint planning',
            calendarId: 'team',
            start: at(7, '09:30'),
            end: at(7, '11:00')
        },
        {
            id: 'side',
            title: 'Side project hack',
            calendarId: 'side',
            start: at(2, '19:00'),
            end: at(2, '21:00')
        }
    ])

    let view = $state('month')
    let date = $state<ZonedDateTime>(now(timeZone))
    let locale = $state('en-US')
    let hiddenCalendars = $state(['side'])

    const moreItems = [
        { label: 'English', icon: 'lucide:languages', onSelect: () => (locale = 'en-US') },
        { label: 'Tiếng Việt', icon: 'lucide:languages', onSelect: () => (locale = 'vi-VN') },
        { type: 'separator' as const },
        { label: 'Print', icon: 'lucide:printer', onSelect: () => window.print() }
    ]
</script>

<svelte:head>
    <title>@sv5ui/scheduler</title>
</svelte:head>

<div class="flex h-screen min-h-0 flex-col bg-surface text-on-surface">
    <Scheduler
        bind:view
        bind:date
        bind:events
        bind:hiddenCalendars
        {calendars}
        {dragSources}
        {timeZone}
        {locale}
        labels={locale === 'vi-VN' ? vi : undefined}
        hour12={false}
        weekStartsOn={0}
        businessHours={{ start: '09:00', end: '18:00', days: [1, 2, 3, 4, 5] }}
        holidays={[{ date: dayOf(9), title: 'Family day' }]}
        weekNumbers
        sidebar
        creatable={false}
        class="min-h-0 flex-1"
    >
        {#snippet toolbarActions()}
            <ThemeModeButton />
            <DropdownMenu items={moreItems} side="bottom" align="end" ui={{ content: 'w-48' }}>
                {#snippet children({ open, props })}
                    <Button
                        {...props}
                        variant="ghost"
                        color="surface"
                        size="sm"
                        square
                        icon="lucide:ellipsis"
                        aria-label="More options"
                        aria-expanded={open}
                    />
                {/snippet}
            </DropdownMenu>
        {/snippet}
    </Scheduler>
</div>

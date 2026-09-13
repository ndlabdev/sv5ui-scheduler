<script lang="ts">
    import {
        getLocalTimeZone,
        now,
        toCalendarDate,
        parseDate,
        toZoned,
        type DateValue,
        type ZonedDateTime
    } from '@internationalized/date'
    import {
        Button,
        Calendar,
        Checkbox,
        DropdownMenu,
        Icon,
        Input,
        Kbd,
        ThemeModeButton,
        useKbd
    } from 'sv5ui'
    import { Scheduler, type EventColor, type EventInput, type Mutation } from '$lib/index.js'
    import { vi } from '$lib/locales.js'

    interface Source {
        id: string
        label: string
        color: EventColor
    }

    interface Payload {
        calendarId: string
    }

    const SOURCES: Source[] = [
        { id: 'work', label: 'Work', color: 'primary' },
        { id: 'personal', label: 'Personal', color: 'success' },
        { id: 'birthdays', label: 'Birthdays', color: 'warning' },
        { id: 'holidays', label: 'Holidays', color: 'tertiary' },
        { id: 'side', label: 'Side Projects', color: 'surface' },
        { id: 'travel', label: 'Travel', color: 'error' },
        { id: 'team', label: 'Team', color: 'info' },
        { id: 'marketing', label: 'Marketing', color: 'secondary' }
    ]

    const SWATCH: Record<EventColor, string> = {
        primary: 'bg-primary',
        secondary: 'bg-secondary',
        tertiary: 'bg-tertiary',
        success: 'bg-success',
        warning: 'bg-warning',
        error: 'bg-error',
        info: 'bg-info',
        surface: 'bg-outline'
    }

    const timeZone = getLocalTimeZone()
    const today = now(timeZone).set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
    const on = (offset: number, time: string) =>
        `${today.add({ days: offset }).toString().slice(0, 10)}T${time}`
    const dayOf = (offset: number) => today.add({ days: offset }).toString().slice(0, 10)
    const colorOf = (calendarId: string) =>
        SOURCES.find((source) => source.id === calendarId)?.color ?? 'primary'

    interface Seed extends Partial<EventInput<Payload>> {
        calendarId: string
        when: [string, string]
    }

    function seed(id: string, title: string, { calendarId, when, ...rest }: Seed) {
        return {
            id,
            title,
            start: when[0],
            end: when[1],
            color: colorOf(calendarId),
            data: { calendarId },
            ...rest
        } satisfies EventInput<Payload>
    }

    let events = $state<EventInput<Payload>[]>([
        seed('standup', 'Daily standup', {
            calendarId: 'team',
            when: [on(-14, '09:00'), on(-14, '09:30')],
            recurrence: { freq: 'weekly', byDay: [1, 2, 3, 4, 5] }
        }),
        seed('review', 'Design review', {
            calendarId: 'work',
            when: [on(0, '10:00'), on(0, '11:30')]
        }),
        seed('pairing', 'Pairing session', {
            calendarId: 'work',
            when: [on(0, '10:30'), on(0, '12:00')]
        }),
        seed('lunch', 'Lunch', {
            calendarId: 'personal',
            when: [on(0, '12:00'), on(0, '13:00')],
            background: true
        }),
        seed('dentist', 'Dentist appointment', {
            calendarId: 'personal',
            when: [on(1, '15:00'), on(1, '15:45')]
        }),
        seed('ship', 'Ship v0.1', { calendarId: 'work', when: [on(2, '14:00'), on(2, '16:00')] }),
        seed('deploy', 'Late deploy', {
            calendarId: 'team',
            when: [on(3, '23:00'), on(4, '01:00')]
        }),
        seed('offsite', 'Marketing offsite', {
            calendarId: 'marketing',
            when: [dayOf(4), dayOf(6)],
            allDay: true
        }),
        seed('trip', 'Client trip', {
            calendarId: 'travel',
            when: [on(-2, '09:00'), on(1, '18:00')]
        }),
        seed('birthday', 'Sarah birthday', {
            calendarId: 'birthdays',
            when: [dayOf(6), dayOf(7)],
            allDay: true
        }),
        seed('holiday', 'Family day', {
            calendarId: 'holidays',
            when: [dayOf(9), dayOf(10)],
            allDay: true
        }),
        seed('sprint', 'Sprint planning', {
            calendarId: 'team',
            when: [on(7, '09:30'), on(7, '11:00')]
        }),
        seed('side', 'Side project hack', {
            calendarId: 'side',
            when: [on(2, '19:00'), on(2, '21:00')]
        })
    ])

    let hidden = $state<string[]>(['side'])
    let query = $state('')
    let view = $state('month')
    let date = $state<ZonedDateTime>(now(timeZone))
    let locale = $state('en-US')
    let panelOpen = $state(true)
    let search = $state<HTMLInputElement | null>(null)

    const visible = $derived(
        events.filter(
            (event) =>
                !hidden.includes(event.data?.calendarId ?? '') &&
                event.title.toLowerCase().includes(query.trim().toLowerCase())
        )
    )
    const busyDays = $derived(new Set(visible.flatMap(coveredDays)))

    function coveredDays(event: EventInput<Payload>): string[] {
        const first = parseDate(String(event.start).slice(0, 10))
        const endText = String(event.end)
        const endDay = parseDate(endText.slice(0, 10))
        const endsAtMidnight = endText.length === 10 || endText.slice(11, 16) === '00:00'
        const last = endsAtMidnight ? endDay.subtract({ days: 1 }) : endDay
        const days: string[] = []
        for (
            let day = first;
            day.compare(last) <= 0 && days.length <= 366;
            day = day.add({ days: 1 })
        ) {
            days.push(day.toString())
        }
        return days.length > 0 ? days : [first.toString()]
    }
    const calendarValue = $derived(toCalendarDate(date))
    const monthKey = $derived(`${date.year}-${date.month}`)

    const moreItems = [
        { label: 'English', icon: 'lucide:languages', onSelect: () => (locale = 'en-US') },
        { label: 'Tiếng Việt', icon: 'lucide:languages', onSelect: () => (locale = 'vi-VN') },
        { type: 'separator' as const },
        { label: 'Print', icon: 'lucide:printer', onSelect: () => window.print() }
    ]

    useKbd({
        preventDefault: false,
        shortcuts: {
            '/': (event: KeyboardEvent) => {
                const target = event.target
                if (target instanceof HTMLElement && /^(INPUT|TEXTAREA)$/.test(target.tagName))
                    return
                event.preventDefault()
                search?.focus()
            }
        }
    })

    function toggle(calendarId: string) {
        hidden = hidden.includes(calendarId)
            ? hidden.filter((id) => id !== calendarId)
            : [...hidden, calendarId]
    }

    function apply(mutation: Mutation<Payload>) {
        if (!mutation.after) {
            events = events.filter((event) => event.id !== mutation.eventId)
            return
        }
        const index = events.findIndex((event) => event.id === mutation.eventId)
        const after: EventInput<Payload> = {
            ...mutation.after,
            data: mutation.after.data ?? { calendarId: 'work' }
        }
        if (index === -1) events.push(after)
        else events[index] = after
    }

    function createEvent() {
        const start = now(timeZone).add({ hours: 1 }).set({ minute: 0, second: 0, millisecond: 0 })
        const id = `created-${crypto.randomUUID()}`
        events.push(
            seed(id, 'New event', {
                calendarId: 'work',
                when: [start.toString(), start.add({ hours: 1 }).toString()]
            })
        )
        date = start
        view = 'week'
    }

    function pickDate(value: DateValue | undefined) {
        if (value) date = toZoned(value, timeZone).set({ hour: 12 })
    }
</script>

<svelte:head>
    <title>@sv5ui/scheduler</title>
</svelte:head>

<div class="flex h-screen min-h-0 bg-surface text-on-surface">
    {#if panelOpen}
        <aside
            class="hidden w-72 shrink-0 flex-col border-e border-outline-variant/60 bg-surface-container-lowest lg:flex"
        >
            <div class="shrink-0 space-y-4 p-4 pb-3">
                <Button color="primary" leadingIcon="lucide:plus" block onclick={createEvent}>
                    Create event
                </Button>

                <div class="space-y-1">
                    {#key monthKey}
                        <Calendar
                            type="single"
                            value={calendarValue}
                            placeholder={calendarValue}
                            weekStartsOn={0}
                            size="sm"
                            isDateHighlightable={(value) => busyDays.has(value.toString())}
                            onValueChange={pickDate}
                            class="w-full"
                        />
                    {/key}
                    <Button
                        variant="link"
                        color="primary"
                        class="text-xs"
                        ui={{ base: 'p-0' }}
                        onclick={() => (date = now(timeZone))}
                    >
                        Today
                    </Button>
                </div>

                <Input
                    bind:ref={search}
                    bind:value={query}
                    placeholder="Search events..."
                    leadingIcon="lucide:search"
                    size="sm"
                    aria-label="Search events"
                >
                    {#snippet trailingSlot()}
                        <Kbd value="/" size="sm" />
                    {/snippet}
                </Input>
            </div>

            <div class="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 pt-1 pb-4">
                <section class="space-y-1.5">
                    <p
                        class="px-1 text-[11px] font-semibold tracking-wider text-on-surface-variant/70 uppercase"
                    >
                        My calendars
                    </p>
                    <ul>
                        {#each SOURCES as source (source.id)}
                            {@const shown = !hidden.includes(source.id)}
                            <li
                                class="flex items-center gap-2.5 rounded-md px-1.5 py-1.5 hover:bg-surface-container-high"
                            >
                                <label
                                    class="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5"
                                >
                                    <Checkbox
                                        checked={shown}
                                        onCheckedChange={() => toggle(source.id)}
                                        size="sm"
                                        aria-label={source.label}
                                    />
                                    <span
                                        class={['size-3 shrink-0 rounded-sm', SWATCH[source.color]]}
                                    ></span>
                                    <span
                                        class={[
                                            'min-w-0 flex-1 truncate text-sm',
                                            shown ? 'text-on-surface' : 'text-on-surface-variant/60'
                                        ]}
                                    >
                                        {source.label}
                                    </span>
                                </label>
                            </li>
                        {/each}
                    </ul>
                </section>
            </div>
        </aside>
    {/if}

    <main class="flex min-w-0 flex-1 flex-col">
        <Scheduler
            bind:view
            bind:date
            events={visible}
            {timeZone}
            {locale}
            labels={locale === 'vi-VN' ? vi : undefined}
            hour12={false}
            weekStartsOn={0}
            businessHours={{ start: '09:00', end: '18:00', days: [1, 2, 3, 4, 5] }}
            holidays={[{ date: dayOf(9), title: 'Family day' }]}
            weekNumbers
            class="min-h-0 flex-1"
            onMutate={apply}
            onMenu={() => (panelOpen = !panelOpen)}
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

            {#snippet eventDetail({ event })}
                {@const source = SOURCES.find((s) => s.id === event.data?.calendarId)}
                {#if source}
                    <p class="mt-3 flex items-center gap-2 text-sm text-on-surface-variant">
                        <Icon name="lucide:folder" size={14} />
                        {source.label}
                    </p>
                {/if}
            {/snippet}
        </Scheduler>
    </main>
</div>

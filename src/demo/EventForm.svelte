<script lang="ts">
    import type { DateValue, ZonedDateTime } from '@internationalized/date'
    import { toCalendarDate, toCalendarDateTime, toZoned } from '@internationalized/date'
    import { Button, DatePicker, FormField, Input, Select, Switch, Textarea } from 'sv5ui'
    import { untrack } from 'svelte'
    import type { NewEventInput, SchedulerCalendar } from '$lib/index.js'

    interface Notes {
        notes: string
    }

    interface Props {
        start: ZonedDateTime
        end: ZonedDateTime
        allDay: boolean
        calendars: SchedulerCalendar[]
        onSubmit: (input: NewEventInput<Notes>) => void
        onCancel: () => void
    }

    let { start, end, allDay, calendars, onSubmit, onCancel }: Props = $props()

    let title = $state('')
    let calendarId = $state(untrack(() => calendars[0]?.id ?? ''))
    let wholeDay = $state(untrack(() => allDay))
    let from = $state(untrack(() => start))
    let to = $state(untrack(() => end))
    let notes = $state('')

    const calendarItems = $derived(
        calendars.map((calendar) => ({ label: calendar.title, value: calendar.id }))
    )

    function pick(value: DateValue | undefined, fallback: ZonedDateTime) {
        return value ? toZoned(toCalendarDateTime(value), fallback.timeZone) : fallback
    }

    function submit(event: SubmitEvent) {
        event.preventDefault()
        if (!title.trim()) return
        onSubmit({
            title: title.trim(),
            calendarId,
            start: wholeDay ? toCalendarDate(from).toString() : from,
            end: wholeDay ? toCalendarDate(to).toString() : to,
            allDay: wholeDay,
            data: { notes }
        })
    }
</script>

<form class="flex flex-col gap-4" onsubmit={submit}>
    <FormField label="Title" required>
        <Input bind:value={title} placeholder="What is it about?" autofocus />
    </FormField>
    <FormField label="Calendar">
        <Select items={calendarItems} bind:value={calendarId} />
    </FormField>
    <FormField label="All day">
        <Switch bind:checked={wholeDay} />
    </FormField>
    <div class="flex flex-col gap-3">
        <FormField label="Starts">
            <DatePicker
                value={from}
                granularity={wholeDay ? 'day' : 'minute'}
                onValueChange={(value) => (from = pick(value, from))}
            />
        </FormField>
        <FormField label="Ends">
            <DatePicker
                value={to}
                granularity={wholeDay ? 'day' : 'minute'}
                minValue={from}
                onValueChange={(value) => (to = pick(value, to))}
            />
        </FormField>
    </div>
    <FormField label="Notes">
        <Textarea bind:value={notes} rows={3} placeholder="Agenda, links, anything" />
    </FormField>
    <div class="flex justify-end gap-2 pt-2">
        <Button label="Cancel" variant="ghost" color="surface" type="button" onclick={onCancel} />
        <Button label="Save" color="primary" type="submit" />
    </div>
</form>

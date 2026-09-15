<script lang="ts">
    import { now } from '@internationalized/date'
    import { Button, toast } from 'sv5ui'
    import {
        Scheduler,
        type CreatePanelSnippetProps,
        type EventInput,
        type EventPanelSnippetProps,
        type Mutation,
        type SlotSelection
    } from '$lib/index.js'
    import DemoCard from '../../../demo/DemoCard.svelte'
    import EventForm from '../../../demo/EventForm.svelte'
    import PageHeader from '../../../demo/PageHeader.svelte'
    import { calendars, teamEvents, timeZone } from '../../../demo/data.js'
    import { describeMutation, describeTime } from '../../../demo/format.js'

    interface Notes {
        notes: string
    }

    let events = $state<EventInput<Notes>[]>(
        teamEvents().map((event) => ({ ...event, data: { notes: '' } }))
    )
    let draft = $state<SlotSelection | null>(null)

    function onMutate(mutation: Mutation<Notes>) {
        toast(describeMutation(mutation), { color: 'success', description: 'Saved to your API' })
    }

    function nextHour() {
        const start = now(timeZone).set({ minute: 0, second: 0, millisecond: 0 }).add({ hours: 1 })
        draft = { start, end: start.add({ hours: 1 }), allDay: false }
    }

    const code = `<Scheduler bind:events bind:draft createPanel={form} eventPanel={details} />

{#snippet form({ start, end, allDay, close, create })}
    <EventForm {start} {end} {allDay} onSubmit={create} onCancel={close} />
{/snippet}

<Button label="Create event" onclick={() => (draft = { start, end, allDay: false })} />`
</script>

{#snippet form({ start, end, allDay, close, create }: CreatePanelSnippetProps<Notes>)}
    <EventForm {start} {end} {allDay} {calendars} onSubmit={create} onCancel={close} />
{/snippet}

{#snippet details({ event, close, remove, deletable }: EventPanelSnippetProps<Notes>)}
    <p class="text-sm text-on-surface-variant">{describeTime(event)}</p>
    {#if event.data?.notes}
        <p class="text-sm whitespace-pre-wrap text-on-surface">{event.data.notes}</p>
    {/if}
    <div class="flex gap-2 pt-2">
        <Button label="Done" color="primary" onclick={close} />
        {#if deletable}
            <Button label="Delete" color="error" variant="soft" onclick={remove} />
        {/if}
    </div>
{/snippet}

{#snippet actions()}
    <Button label="Create event" icon="lucide:plus" color="primary" onclick={nextHour} />
{/snippet}

<div class="mx-auto max-w-[1600px] space-y-8 px-4 py-8 sm:px-6 lg:px-8">
    <PageHeader
        icon="lucide:square-pen"
        badge="Interaction"
        title="Event editor"
        description="Every app stores something different, so the form is yours. The scheduler opens a panel whenever the user picks where an event should go, hands the range to your snippet, and saves whatever you build through the same pipeline as drag and drop."
    />

    <DemoCard
        title="Create and edit with your own form"
        description="Click an empty slot, drag over a range, press Enter on a focused slot, or use the toolbar button. The form below is built from sv5ui inputs and is not part of the library. Click an event to edit it in the same panel."
        {code}
        height="h-[760px]"
    >
        <Scheduler
            bind:events
            bind:draft
            {timeZone}
            {calendars}
            createPanel={form}
            detail="slideover"
            eventPanel={details}
            toolbarActions={actions}
            {onMutate}
            class="h-full"
        />
    </DemoCard>
</div>

<script lang="ts">
    import type { ZonedDateTime } from '@internationalized/date'
    import type { EventInput } from '../../lib/types/event.types.js'
    import type { MutationHandlers } from '../../lib/types/mutation.types.js'
    import type { EventPanelSnippetProps } from '../../lib/types/snippet.types.js'
    import { untrack } from 'svelte'
    import { Scheduler } from '../../lib/index.js'

    interface Props {
        initial?: EventInput[]
        date?: ZonedDateTime
        custom?: boolean
        editable?: boolean
        onMutate?: MutationHandlers['onMutate']
        dir?: 'ltr' | 'rtl'
        detail?: 'popover' | 'slideover'
    }

    let {
        initial = [],
        date,
        custom = false,
        editable = true,
        onMutate,
        dir = 'ltr',
        detail = 'slideover'
    }: Props = $props()

    let events = $state(untrack(() => initial))

    export function getEvents() {
        return $state.snapshot(events)
    }

    export function removeEvent(id: string) {
        events = events.filter((event) => event.id !== id)
    }
</script>

{#snippet panel({ event, close, remove, update, deletable }: EventPanelSnippetProps)}
    <p data-probe-panel>{event.title}</p>
    <p data-probe-deletable>{String(deletable)}</p>
    <button type="button" data-probe-close onclick={close}>Done</button>
    <button type="button" data-probe-remove onclick={remove}>Remove</button>
    <button type="button" data-probe-rename onclick={() => update({ title: 'Renamed' })}>
        Rename
    </button>
    <button type="button" data-probe-locate onclick={() => update({ data: { room: 'B2' } })}>
        Locate
    </button>
{/snippet}

<div style="height: 800px; width: 1100px">
    <Scheduler
        bind:events
        {date}
        {editable}
        {onMutate}
        {dir}
        timeZone="Asia/Ho_Chi_Minh"
        {detail}
        eventPanel={custom ? panel : undefined}
        calendars={[{ id: 'work', title: 'Work', color: 'info' }]}
        class="h-full"
    />
</div>

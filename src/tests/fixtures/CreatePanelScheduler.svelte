<script lang="ts">
    import type { ZonedDateTime } from '@internationalized/date'
    import type { EventInput } from '../../lib/types/event.types.js'
    import type { SlotSelection } from '../../lib/types/interaction.types.js'
    import type { MutationHandlers } from '../../lib/types/mutation.types.js'
    import type { CreatePanelSnippetProps } from '../../lib/types/snippet.types.js'
    import { untrack } from 'svelte'
    import { Scheduler } from '../../lib/index.js'
    import DraftEcho from './DraftEcho.svelte'

    interface Props {
        initial?: EventInput[]
        date?: ZonedDateTime
        creatable?: boolean
        onMutate?: MutationHandlers['onMutate']
        onSelectSlot?: (selection: SlotSelection) => void
    }

    let { initial = [], date, creatable = true, onMutate, onSelectSlot }: Props = $props()

    let events = $state(untrack(() => initial))
    let draft = $state<SlotSelection | null>(null)

    export function getEvents() {
        return $state.snapshot(events)
    }

    export function getDraft() {
        return draft
    }

    export function openAt(selection: SlotSelection) {
        draft = selection
    }
</script>

{#snippet form({ start, end, allDay, close, create }: CreatePanelSnippetProps)}
    <p data-probe-range>{start.toString().slice(0, 16)} {end.toString().slice(0, 16)}</p>
    <p data-probe-all-day>{String(allDay)}</p>
    <DraftEcho {start} />
    <button type="button" data-probe-cancel onclick={close}>Cancel</button>
    <button
        type="button"
        data-probe-save
        onclick={() => create({ title: 'Planned', start, end, allDay, color: 'success' })}
    >
        Save
    </button>
{/snippet}

<div style="height: 1400px; width: 1100px">
    <Scheduler
        bind:events
        bind:draft
        {date}
        {creatable}
        {onMutate}
        {onSelectSlot}
        timeZone="Asia/Ho_Chi_Minh"
        createPanel={form}
        class="h-full"
    />
</div>

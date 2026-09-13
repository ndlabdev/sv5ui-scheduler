<script lang="ts">
    import type { ZonedDateTime } from '@internationalized/date'
    import type { EventInput } from '../../lib/types/event.types.js'
    import type { DragSourceData } from '../../lib/types/extension.types.js'
    import type { MutationHandlers } from '../../lib/types/mutation.types.js'
    import { untrack } from 'svelte'
    import { Scheduler, dragSource } from '../../lib/index.js'

    interface Props {
        initial?: EventInput[]
        item: DragSourceData
        onMutate?: MutationHandlers['onMutate']
        date?: ZonedDateTime
        view?: string
        second?: boolean
    }

    let { initial = [], item, onMutate, date, view = 'week', second = false }: Props = $props()

    let events = $state(untrack(() => initial))
    let others = $state<EventInput[]>([])

    export function getEvents() {
        return $state.snapshot(events)
    }

    export function getOthers() {
        return $state.snapshot(others)
    }
</script>

<div style="display: flex; gap: 16px; height: {second ? 800 : 600}px">
    <ul style="width: 120px; list-style: none; margin: 0; padding: 0">
        <li>
            <button type="button" data-source {@attach dragSource(() => item)}>
                {item.title}
            </button>
        </li>
    </ul>
    <div style="display: flex; flex: 1; min-width: 0; flex-direction: column; gap: 16px">
        <div style="flex: 1; min-height: 0" data-first>
            <Scheduler bind:events {view} timeZone="Asia/Ho_Chi_Minh" {date} {onMutate} />
        </div>
        {#if second}
            <div style="flex: 1; min-height: 0" data-second>
                <Scheduler bind:events={others} {view} timeZone="Asia/Ho_Chi_Minh" {date} />
            </div>
        {/if}
    </div>
</div>

<script lang="ts">
    import type { ZonedDateTime } from '@internationalized/date'
    import type { EventInput } from '../../lib/types/event.types.js'
    import type { MutationHandlers } from '../../lib/types/mutation.types.js'
    import { Scheduler } from '../../lib/index.js'

    interface Props {
        onMutate?: MutationHandlers['onMutate']
        onError?: MutationHandlers['onError']
        date?: ZonedDateTime
        timeZone?: string
    }

    let { onMutate, onError, date, timeZone = 'Asia/Ho_Chi_Minh' }: Props = $props()

    let events = $state<EventInput[]>([])

    export function load(list: EventInput[]) {
        events = list
    }

    export function getEvents() {
        return $state.snapshot(events)
    }
</script>

<div style="height: 1400px">
    <Scheduler bind:events {timeZone} {date} {onMutate} {onError} />
</div>

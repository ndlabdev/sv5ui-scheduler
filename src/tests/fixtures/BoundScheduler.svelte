<script lang="ts">
    import type { ZonedDateTime } from '@internationalized/date'
    import type { EventInput, SchedulerCalendar } from '../../lib/types/event.types.js'
    import type { InteractionPlugin } from '../../lib/types/interaction.types.js'
    import type { MutationHandlers } from '../../lib/types/mutation.types.js'
    import { untrack } from 'svelte'
    import { Scheduler } from '../../lib/index.js'

    interface Props {
        initial: EventInput[]
        interactions?: InteractionPlugin[]
        onMutate?: MutationHandlers['onMutate']
        date?: ZonedDateTime
        view?: string
        dir?: 'ltr' | 'rtl'
        calendars?: SchedulerCalendar[]
    }

    let {
        initial,
        interactions = [],
        onMutate,
        date,
        view: initialView = 'week',
        dir,
        calendars
    }: Props = $props()

    let events = $state(untrack(() => initial))
    let view = $state(untrack(() => initialView))

    export function getEvents() {
        return $state.snapshot(events)
    }

    export function push(event: EventInput) {
        events.push(event)
    }

    export function getView() {
        return view
    }
</script>

<div style="height: 1400px">
    <Scheduler
        bind:events
        bind:view
        timeZone="Asia/Ho_Chi_Minh"
        {date}
        {interactions}
        {onMutate}
        {dir}
        {calendars}
    />
</div>

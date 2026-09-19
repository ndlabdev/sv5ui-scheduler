<script lang="ts">
    import type { ZonedDateTime } from '@internationalized/date'
    import { untrack } from 'svelte'
    import type { EventInput, SchedulerCalendar } from '../../lib/types/event.types.js'
    import type { DragSourceData } from '../../lib/types/interaction.types.js'
    import type { MutationHandlers } from '../../lib/types/mutation.types.js'
    import { CalendarList, DragSourceList, Scheduler, SearchBox } from '../../lib/index.js'

    interface Props {
        initial: EventInput[]
        calendars: SchedulerCalendar[]
        items?: DragSourceData[]
        date: ZonedDateTime
        onMutate?: MutationHandlers['onMutate']
    }

    let { initial, calendars, items = [], date, onMutate }: Props = $props()

    let events = $state(untrack(() => initial))
    let hidden = $state<string[]>([])
    let search = $state('')

    export function getHidden() {
        return $state.snapshot(hidden)
    }

    export function getSearch() {
        return search
    }

    export function getEvents() {
        return $state.snapshot(events)
    }
</script>

<div style="display: flex; gap: 12px; height: 900px">
    <aside style="display: flex; width: 150px; flex-direction: column; gap: 12px">
        <SearchBox bind:value={search} />
        <CalendarList {calendars} bind:hiddenCalendars={hidden} />
        <DragSourceList {items} {calendars} />
        <input data-other aria-label="other" />
    </aside>
    <div style="min-width: 0; flex: 1">
        <Scheduler
            bind:events
            bind:hiddenCalendars={hidden}
            bind:search
            {calendars}
            timeZone="Asia/Ho_Chi_Minh"
            {date}
            {onMutate}
        />
    </div>
</div>

<script lang="ts">
    import type { ZonedDateTime } from '@internationalized/date'
    import type { EventInput } from '../../lib/types/event.types.js'
    import { untrack } from 'svelte'
    import { DateNavigator, Scheduler } from '../../lib/index.js'

    interface Props {
        events?: EventInput[]
        date?: ZonedDateTime
        width?: number
        side?: 'start' | 'end'
        open?: boolean
        dir?: 'ltr' | 'rtl'
    }

    let { events = [], date, width = 1200, side = 'start', open = true, dir }: Props = $props()

    let sidebarOpen = $state(untrack(() => open))
    let view = $state('week')
    let current = $state(untrack(() => date))

    export function isOpen() {
        return sidebarOpen
    }

    export function getView() {
        return view
    }
</script>

<div style="width: {width}px; height: 700px">
    <Scheduler
        {events}
        bind:date={current}
        bind:view
        bind:sidebarOpen
        sidebarSide={side}
        timeZone="Asia/Ho_Chi_Minh"
        {dir}
    >
        {#snippet sidebar(props)}
            <div
                data-probe-docked={props.docked}
                data-probe-date={props.date.toString().slice(0, 10)}
            >
                <DateNavigator
                    date={props.date}
                    events={props.events}
                    timeZone={props.scheduler.timeZone}
                    locale={props.scheduler.locale}
                    weekStartsOn={props.scheduler.weekStartsOn}
                    onSelect={(day) => props.navigate(day)}
                />
                <button
                    type="button"
                    data-probe-agenda
                    onclick={() => props.navigate(props.date, 'agenda')}
                >
                    agenda
                </button>
                <button type="button" data-probe-close onclick={props.close}>close</button>
            </div>
        {/snippet}
    </Scheduler>
</div>

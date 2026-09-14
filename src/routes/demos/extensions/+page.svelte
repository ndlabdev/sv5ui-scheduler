<script lang="ts">
    import { getDayOfWeek } from '@internationalized/date'
    import { Badge, useEventListener } from 'sv5ui'
    import {
        Scheduler,
        WeekView,
        type EventInput,
        type InteractionPlugin,
        type StoreMiddleware,
        type ViewDefinition
    } from '$lib/index.js'
    import DemoCard from '../../../demo/DemoCard.svelte'
    import LogPanel from '../../../demo/LogPanel.svelte'
    import PageHeader from '../../../demo/PageHeader.svelte'
    import { EventLog } from '../../../demo/log.svelte.js'
    import { calendars, teamEvents, timeZone } from '../../../demo/data.js'

    let events = $state<EventInput[]>(teamEvents())
    let view = $state('workweek')
    let pointer = $state<string | null>(null)
    const log = new EventLog()

    const hourFormat = new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        hour: 'numeric',
        minute: '2-digit'
    })
    const dayFormat = new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
    })

    const workWeek: ViewDefinition = {
        name: 'workweek',
        label: 'Work week',
        layout: 'time-grid',
        range: (anchor) => {
            const start = anchor
                .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
                .subtract({ days: getDayOfWeek(anchor, 'en-GB') })
            return { start, end: start.add({ days: 5 }) }
        },
        step: (anchor, direction) => anchor.add({ weeks: direction }),
        component: WeekView
    }

    const pointerTime: InteractionPlugin = {
        name: 'pointer-time',
        attach: (context) => (node) => {
            useEventListener(node, 'pointermove', (event: PointerEvent) => {
                const hit = context.hitTest(event.clientX, event.clientY)
                if (!hit) return
                const date = hit.date.toDate()
                pointer = hit.allDay ? dayFormat.format(date) : hourFormat.format(date)
            })
            useEventListener(node, 'pointerleave', () => (pointer = null))
        }
    }

    const logger: StoreMiddleware = (next) => (patch) => {
        if (patch.type === 'upsert') log.add('upsert', patch.event.title, 'primary')
        if (patch.type === 'remove') log.add('remove', patch.eventId, 'error')
        if (patch.type === 'reset') log.add('reset', `${patch.events.length} events`, 'surface')
        next(patch)
    }

    const code = `const workWeek = {
    name: 'workweek',
    label: 'Work week',
    layout: 'time-grid',
    range: (anchor) => ({ start: monday(anchor), end: monday(anchor).add({ days: 5 }) }),
    step: (anchor, direction) => anchor.add({ weeks: direction }),
    component: WeekView
}

const logger = (next) => (patch) => {
    console.log(patch.type)
    next(patch)
}

<Scheduler views={[workWeek]} interactions={[pointerTime]} middleware={[logger]} />`
</script>

<div class="mx-auto max-w-[1600px] space-y-10 px-4 py-8 sm:px-6 lg:px-8">
    <PageHeader
        icon="lucide:puzzle"
        badge="Customization"
        title="Extensions"
        description="Views, layouts, interactions and store middleware are registered per scheduler. The built-in features are made from the same pieces, so your additions work exactly like them."
    />

    <DemoCard
        title="A view, an interaction and a middleware"
        description="The work week view reuses the week component with a Monday to Friday range. The pointer plugin reads the grid position under the cursor, and the middleware logs every patch that reaches the store."
        {code}
        height="h-[700px]"
    >
        {#snippet controls()}
            <div class="flex items-center gap-2 text-sm text-on-surface-variant">
                Under the pointer:
                <Badge
                    label={pointer ?? 'move over the grid'}
                    color={pointer ? 'primary' : 'surface'}
                    variant="soft"
                    leadingIcon="lucide:mouse-pointer-2"
                />
            </div>
        {/snippet}
        {#snippet aside()}
            <LogPanel {log} title="Store patches" />
        {/snippet}
        <Scheduler
            creatable={false}
            bind:events
            bind:view
            {timeZone}
            {calendars}
            views={[workWeek]}
            interactions={[pointerTime]}
            middleware={[logger]}
            class="h-full"
        />
    </DemoCard>
</div>

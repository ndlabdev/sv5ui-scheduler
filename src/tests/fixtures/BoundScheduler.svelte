<script lang="ts">
    import type { EventInput } from '../../lib/types/event.types.js'
    import type { InteractionPlugin } from '../../lib/types/extension.types.js'
    import type { Mutation } from '../../lib/types/mutation.types.js'
    import { untrack } from 'svelte'
    import { Scheduler } from '../../lib/index.js'

    interface Props {
        initial: EventInput[]
        interactions?: InteractionPlugin[]
        onMutate?: (mutation: Mutation) => void | Promise<void>
    }

    let { initial, interactions = [], onMutate }: Props = $props()

    let events = $state(untrack(() => initial))
    let view = $state('week')

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

<div style="height: 600px">
    <Scheduler bind:events bind:view timeZone="Asia/Ho_Chi_Minh" {interactions} {onMutate} />
</div>

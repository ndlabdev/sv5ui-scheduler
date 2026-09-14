<script lang="ts">
    import type { ZonedDateTime } from '@internationalized/date'
    import type { InteractionPlugin } from '../../lib/types/interaction.types.js'
    import type { Mutation } from '../../lib/types/mutation.types.js'
    import type { EventSourceFn } from '../../lib/types/source.types.js'
    import { Scheduler } from '../../lib/index.js'

    interface Props {
        source: EventSourceFn
        interactions?: InteractionPlugin[]
        onMutate?: (mutation: Mutation) => void | Promise<void>
        date?: ZonedDateTime
    }

    let { source, interactions = [], onMutate, date = $bindable() }: Props = $props()
    let view = $state('week')

    export function next() {
        date = date?.add({ days: 7 })
    }

    export function previous() {
        date = date?.subtract({ days: 7 })
    }
</script>

<div style="height: 600px">
    <Scheduler bind:view bind:date timeZone="Asia/Ho_Chi_Minh" {source} {interactions} {onMutate} />
</div>

<script lang="ts">
    import type { ZonedDateTime } from '@internationalized/date'
    import type { EventInput } from '../../lib/types/event.types.js'
    import type { InteractionPlugin } from '../../lib/types/interaction.types.js'
    import { Scheduler } from '../../lib/index.js'

    interface Props {
        events: EventInput[]
        interactions?: InteractionPlugin[]
        date?: ZonedDateTime
    }

    let { events, interactions = [], date }: Props = $props()

    let search = $state('')

    export function type(value: string) {
        search = value
    }
</script>

<div style="height: 900px">
    <Scheduler {events} {search} {interactions} {date} timeZone="Asia/Ho_Chi_Minh" />
</div>

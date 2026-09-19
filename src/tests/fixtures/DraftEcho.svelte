<script lang="ts">
    import type { ZonedDateTime } from '@internationalized/date'
    import { untrack } from 'svelte'

    let { start }: { start: ZonedDateTime } = $props()

    let initial = $state(untrack(() => start.toString().slice(0, 16)))
</script>

<p data-probe-initial>{initial}</p>

<script lang="ts">
    import { Scheduler } from '../../lib/index.js'
    import { ZONE, anchor } from './dom.js'

    let { view = 'week' }: { view?: string } = $props()
</script>

<div style="display: flex; flex-direction: column; height: 600px" data-page>
    <header style="height: 56px">Header</header>
    <Scheduler timeZone={ZONE} date={anchor} {view} events={[]} class="min-h-0 flex-1" />
    <footer style="height: 40px">Footer</footer>
</div>

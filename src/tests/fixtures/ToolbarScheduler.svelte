<script lang="ts">
    import type { ZonedDateTime } from '@internationalized/date'
    import type { EventInput } from '../../lib/types/event.types.js'
    import type { ToolbarSnippetProps } from '../../lib/types/snippet.types.js'
    import { untrack } from 'svelte'
    import { Scheduler } from '../../lib/index.js'

    interface Props {
        initial?: EventInput[]
        date?: ZonedDateTime
        sidebar?: boolean
        onMenu?: () => void
    }

    let { initial = [], date, sidebar = false, onMenu }: Props = $props()

    let events = $state(untrack(() => initial))
</script>

{#snippet header(props: ToolbarSnippetProps)}
    <div data-probe-toolbar>
        <h1 data-probe-title>{props.title}</h1>
        <button type="button" data-probe-prev onclick={() => props.step(-1)}>Prev</button>
        <button type="button" data-probe-next onclick={() => props.step(1)}>Next</button>
        <button type="button" data-probe-today onclick={props.today}>Today</button>
        <button type="button" data-probe-menu onclick={props.toggleSidebar}>
            {props.sidebarOpen ? 'Hide' : 'Show'}
        </button>
        {#each props.views as item (item.name)}
            <button
                type="button"
                data-probe-view={item.name}
                aria-pressed={props.view === item.name}
                onclick={() => props.setView(item.name)}
            >
                {item.label}
            </button>
        {/each}
    </div>
{/snippet}

<div style="height: 700px; width: 1100px">
    <Scheduler
        bind:events
        {date}
        timeZone="Asia/Ho_Chi_Minh"
        toolbar={header}
        {sidebar}
        {onMenu}
        class="h-full"
    />
</div>

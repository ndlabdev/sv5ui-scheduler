<script lang="ts" generics="T">
    import { Slideover } from 'sv5ui'
    import type { Snippet } from 'svelte'
    import type { NewEventInput } from '../../../types/event.types.js'
    import type { SchedulerContext } from '../../../types/context.types.js'
    import type { SlotSelection } from '../../../types/interaction.types.js'
    import type { CreatePanelSnippetProps } from '../../../types/snippet.types.js'
    import { createPanelVariants } from './create-panel.variants.js'

    interface Props {
        draft: SlotSelection | null
        scheduler: SchedulerContext
        side: 'left' | 'right'
        overlayClass: string
        contentClass: string
        panel: Snippet<[CreatePanelSnippetProps<T>]>
        onClose: () => void
        onCreate: (input: NewEventInput<T>) => void
    }

    let { draft, scheduler, side, overlayClass, contentClass, panel, onClose, onCreate }: Props =
        $props()

    const classes = createPanelVariants()
    let shown = $state.raw<SlotSelection | null>(null)

    $effect(() => {
        if (draft) shown = draft
    })

    function setOpen(value: boolean) {
        if (!value) onClose()
    }

    function create(input: NewEventInput<T>) {
        onCreate(input)
        onClose()
    }
</script>

{#if shown}
    {@const selection = shown}
    <Slideover
        bind:open={() => draft !== null, setOpen}
        {side}
        title={scheduler.labels.createEvent}
        portal={false}
        preventScroll={false}
        ui={{ overlay: overlayClass, content: contentClass }}
    >
        {#snippet body()}
            <div class={classes.body()} data-sch-create-panel>
                {#key selection}
                    {@render panel({
                        start: selection.start,
                        end: selection.end,
                        allDay: selection.allDay,
                        close: onClose,
                        create
                    })}
                {/key}
            </div>
        {/snippet}
    </Slideover>
{/if}

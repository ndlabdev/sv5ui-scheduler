<script lang="ts">
    import { formatTime } from '../../../core/time/format.js'
    import type { SchedulerContext } from '../../../types/context.types.js'
    import type { TimeScale } from '../../../types/layout.types.js'
    import { hourLabels } from './time-grid.js'
    import { timeGridVariants } from './time-grid.variants.js'

    interface Props {
        scale: TimeScale
        scheduler: SchedulerContext
        nowTop: number | null
    }

    let { scale, scheduler, nowTop }: Props = $props()

    const classes = timeGridVariants()
    const hours = $derived(hourLabels(scale, scheduler.locale, scheduler.hour12, nowTop))
    const nowLabel = $derived(formatTime(scheduler.now, scheduler.locale, scheduler.hour12))
</script>

<div class={classes.gutter()} style:height="{scale.dayHeight}px" aria-hidden="true">
    {#each hours as label (label.hour)}
        <span class={classes.hourLabel()} style:top="{label.top}px"
            ><span class={classes.hourStrong()}>{label.parts.hour}</span><span
                class={classes.hourFaint()}>{label.parts.rest}</span
            ></span
        >
    {/each}
    {#if nowTop !== null}
        <span class={classes.nowLabel()} style:top="{nowTop}px">{nowLabel}</span>
    {/if}
</div>

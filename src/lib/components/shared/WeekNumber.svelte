<script lang="ts">
    import type { SchedulerLabels } from '../../types/labels.types.js'

    interface Props {
        week: number
        labels: SchedulerLabels
        class?: string
    }

    let { week, labels, class: className }: Props = $props()
</script>

<span class={className} data-sch-week-number={week}>
    <span aria-hidden="true">{labels.weekNumber(week)}</span>
    <span class="sr-only">{labels.weekNumberLabel(week)}</span>
</span>

<script lang="ts">
    import { Button, ToggleGroup } from 'sv5ui'
    import type { SchedulerLabels } from '../../types/labels.types.js'

    interface Props {
        title: string
        view: string
        views: { value: string; label: string }[]
        labels: SchedulerLabels
        class: string
        onToday: () => void
        onStep: (direction: 1 | -1) => void
        onView: (view: string) => void
    }

    let { title, view, views, labels, class: className, onToday, onStep, onView }: Props = $props()
</script>

<div class={className} data-sch-toolbar>
    <div class="flex items-center gap-1">
        <Button variant="outline" size="sm" onclick={onToday}>{labels.today}</Button>
        <Button
            variant="ghost"
            size="sm"
            square
            leadingIcon="lucide:chevron-left"
            aria-label={labels.previous}
            onclick={() => onStep(-1)}
        />
        <Button
            variant="ghost"
            size="sm"
            square
            leadingIcon="lucide:chevron-right"
            aria-label={labels.next}
            onclick={() => onStep(1)}
        />
    </div>
    <h2
        class="min-w-0 flex-1 truncate text-center text-base font-semibold text-on-surface"
        aria-live="polite"
    >
        {title}
    </h2>
    <ToggleGroup
        type="single"
        size="sm"
        value={view}
        items={views}
        onValueChange={onView}
        aria-label={labels.views}
    />
</div>

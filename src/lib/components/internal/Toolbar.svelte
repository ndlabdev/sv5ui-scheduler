<script lang="ts">
    import { Button, FieldGroup, ToggleGroup } from 'sv5ui'
    import type { Snippet } from 'svelte'
    import type { SchedulerLabels } from '../../types/labels.types.js'
    import { toolbarVariants } from './toolbar.variants.js'

    interface Props {
        title: string
        view: string
        views: { value: string; label: string }[]
        labels: SchedulerLabels
        class: string
        onToday: () => void
        onStep: (direction: 1 | -1) => void
        onView: (view: string) => void
        onMenu?: () => void
        actions?: Snippet
    }

    let {
        title,
        view,
        views,
        labels,
        class: className,
        onToday,
        onStep,
        onView,
        onMenu,
        actions
    }: Props = $props()

    const classes = toolbarVariants()
</script>

<div class={className} data-sch-toolbar>
    <div class={classes.navigation()}>
        {#if onMenu}
            <Button
                variant="ghost"
                color="surface"
                size="sm"
                square
                leadingIcon="lucide:menu"
                aria-label={labels.menu}
                onclick={onMenu}
            />
        {/if}
        <Button variant="outline" color="surface" size="sm" onclick={onToday}>{labels.today}</Button
        >
        <FieldGroup size="sm">
            <Button
                variant="ghost"
                color="surface"
                size="sm"
                square
                leadingIcon="lucide:chevron-left"
                aria-label={labels.previous}
                onclick={() => onStep(-1)}
            />
            <Button
                variant="ghost"
                color="surface"
                size="sm"
                square
                leadingIcon="lucide:chevron-right"
                aria-label={labels.next}
                onclick={() => onStep(1)}
            />
        </FieldGroup>
        <h2 class={classes.title()} aria-live="polite">{title}</h2>
    </div>

    <div class={classes.tools()}>
        <ToggleGroup
            type="single"
            size="sm"
            variant="ghost"
            color="primary"
            value={view}
            items={views}
            onValueChange={onView}
            aria-label={labels.views}
            ui={{ root: classes.switcher() }}
        />
        {@render actions?.()}
    </div>
</div>

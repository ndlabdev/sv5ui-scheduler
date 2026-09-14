<script lang="ts">
    import { Button, Tabs } from 'sv5ui'
    import type { Snippet } from 'svelte'
    import type { SchedulerLabels } from '../../../types/labels.types.js'
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
        menuOpen?: boolean
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
        menuOpen,
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
                icon="lucide:menu"
                aria-label={labels.menu}
                aria-expanded={menuOpen}
                onclick={onMenu}
            />
        {/if}
        <Button variant="outline" color="surface" size="sm" onclick={onToday}>{labels.today}</Button
        >
        <div class={classes.chevrons()}>
            <Button
                variant="ghost"
                color="surface"
                size="sm"
                square
                icon="lucide:chevron-left"
                ui={{ leadingIcon: classes.directional() }}
                aria-label={labels.previous}
                onclick={() => onStep(-1)}
            />
            <Button
                variant="ghost"
                color="surface"
                size="sm"
                square
                icon="lucide:chevron-right"
                ui={{ leadingIcon: classes.directional() }}
                aria-label={labels.next}
                onclick={() => onStep(1)}
            />
        </div>
        <h2 class={classes.title()} aria-live="polite">{title}</h2>
    </div>

    <div class={classes.tools()}>
        <div role="group" aria-label={labels.views} class={classes.switcherGroup()}>
            <Tabs
                items={views}
                value={view}
                variant="pill"
                size="sm"
                content={false}
                class={classes.switcher()}
                onValueChange={onView}
            />
        </div>
        {#if actions}
            <div class={classes.actions()} role="group" aria-label={labels.actions}>
                {@render actions()}
            </div>
        {/if}
    </div>
</div>

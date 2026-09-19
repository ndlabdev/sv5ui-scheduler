<script lang="ts">
    import { Button, Select, Tabs } from 'sv5ui'
    import type { Snippet } from 'svelte'
    import { twMerge } from 'tailwind-merge'
    import type { SchedulerLabels } from '../../../types/labels.types.js'
    import { toolbarVariants } from './toolbar.variants.js'

    interface Props {
        title: string
        view: string
        views: { value: string; label: string }[]
        labels: SchedulerLabels
        compact: boolean
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
        compact,
        class: className,
        onToday,
        onStep,
        onView,
        onMenu,
        menuOpen,
        actions
    }: Props = $props()

    const classes = toolbarVariants()
    const root = $derived(compact ? twMerge(className, classes.compactRoot()) : className)
    const iconButton = $derived(compact ? classes.touchButton() : undefined)

    function pickView(value: string | string[] | undefined) {
        if (typeof value === 'string' && value !== view) onView(value)
    }
</script>

<div class={root} data-sch-toolbar data-sch-compact={compact ? '' : undefined}>
    <div class={classes.navigation({ class: compact ? classes.navigationCompact() : '' })}>
        {#if onMenu}
            <Button
                variant="ghost"
                color="surface"
                size="sm"
                square
                icon="lucide:menu"
                class={iconButton}
                aria-label={labels.menu}
                aria-expanded={menuOpen}
                onclick={onMenu}
            />
        {/if}
        {#if compact}
            <Button
                variant="ghost"
                color="surface"
                size="sm"
                square
                icon="lucide:calendar-check"
                class={iconButton}
                aria-label={labels.today}
                onclick={onToday}
            />
        {:else}
            <Button variant="outline" color="surface" size="sm" onclick={onToday}>
                {labels.today}
            </Button>
        {/if}
        <div class={classes.chevrons()}>
            <Button
                variant="ghost"
                color="surface"
                size="sm"
                square
                icon="lucide:chevron-left"
                class={iconButton}
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
                class={iconButton}
                ui={{ leadingIcon: classes.directional() }}
                aria-label={labels.next}
                onclick={() => onStep(1)}
            />
        </div>
        <h2
            class={classes.title({ class: compact ? classes.titleCompact() : '' })}
            aria-live="polite"
        >
            {title}
        </h2>
    </div>

    <div class={classes.tools()}>
        <div role="group" aria-label={labels.views} class={classes.switcherGroup()}>
            {#if compact}
                <Select
                    items={views}
                    bind:value={() => view, pickView}
                    size="sm"
                    class={classes.select()}
                    ui={{ base: classes.selectTrigger() }}
                />
            {:else}
                <Tabs
                    items={views}
                    value={view}
                    variant="pill"
                    size="sm"
                    content={false}
                    class={classes.switcher()}
                    onValueChange={onView}
                />
            {/if}
        </div>
        {#if actions}
            <div class={classes.actions()} role="group" aria-label={labels.actions}>
                {@render actions()}
            </div>
        {/if}
    </div>
</div>

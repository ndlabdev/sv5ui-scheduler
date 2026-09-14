<script lang="ts">
    import { Badge, Icon } from 'sv5ui'
    import type { Snippet } from 'svelte'

    interface Props {
        title: string
        description: string
        icon?: string
        badge?: string
        actions?: Snippet
    }

    let { title, description, icon, badge, actions }: Props = $props()
</script>

<svelte:head>
    <title>{title} | Scheduler for Svelte 5</title>
</svelte:head>

<header
    class="flex flex-col gap-5 border-b border-outline-variant/60 pb-6 sm:flex-row sm:items-end sm:justify-between"
>
    <div class="flex min-w-0 items-start gap-4">
        {#if icon}
            <span
                class="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"
            >
                <Icon name={icon} size="24" />
            </span>
        {/if}
        <div class="min-w-0 space-y-2">
            {#if badge}
                <Badge label={badge} color="primary" variant="soft" size="sm" />
            {/if}
            <h1 class="text-2xl font-semibold tracking-tight text-on-surface sm:text-3xl">
                {title}
            </h1>
            <p class="max-w-3xl text-sm leading-relaxed text-on-surface-variant sm:text-base">
                {description}
            </p>
        </div>
    </div>
    {#if actions}
        <div class="flex shrink-0 flex-wrap items-center gap-2">
            {@render actions()}
        </div>
    {/if}
</header>

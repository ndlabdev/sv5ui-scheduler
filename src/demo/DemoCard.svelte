<script lang="ts">
    import { Card, Tabs } from 'sv5ui'
    import type { Snippet } from 'svelte'
    import CodeBlock from './CodeBlock.svelte'

    interface Props {
        title: string
        description?: string
        code?: string
        height?: string
        controls?: Snippet
        aside?: Snippet
        children: Snippet
    }

    let {
        title,
        description,
        code,
        height = 'h-[680px]',
        controls,
        aside,
        children
    }: Props = $props()

    let tab = $state('preview')

    const tabs = [
        { label: 'Preview', value: 'preview', icon: 'lucide:eye' },
        { label: 'Code', value: 'code', icon: 'lucide:code-xml' }
    ]
</script>

{#snippet controlBar()}
    <div class="flex flex-wrap items-end gap-x-6 gap-y-4">
        {@render controls?.()}
    </div>
{/snippet}

<section class="space-y-3">
    <div class="flex flex-wrap items-end justify-between gap-3">
        <div class="min-w-0 space-y-1">
            <h2 class="text-lg font-semibold text-on-surface">{title}</h2>
            {#if description}
                <p class="max-w-3xl text-sm leading-relaxed text-on-surface-variant">
                    {description}
                </p>
            {/if}
        </div>
        {#if code}
            <Tabs
                items={tabs}
                value={tab}
                variant="pill"
                size="sm"
                content={false}
                ui={{ root: 'w-auto' }}
                onValueChange={(value) => (tab = value)}
            />
        {/if}
    </div>
    <Card variant="outline" header={controls ? controlBar : undefined}>
        {#if code && tab === 'code'}
            <CodeBlock {code} />
        {:else}
            <div class="flex flex-col gap-4 xl:flex-row">
                <div class="min-w-0 {height} xl:flex-1">
                    {@render children()}
                </div>
                {#if aside}
                    <aside class="h-80 xl:h-auto xl:w-80 xl:shrink-0">
                        {@render aside()}
                    </aside>
                {/if}
            </div>
        {/if}
    </Card>
</section>

<script lang="ts">
    import { Button, Icon, Tooltip, useClipboard } from 'sv5ui'

    interface Props {
        code: string
        filename?: string
    }

    let { code, filename = 'App.svelte' }: Props = $props()

    const clipboard = useClipboard()
</script>

<div
    class="overflow-hidden rounded-xl border border-outline-variant/60 bg-surface-container-lowest"
>
    <div
        class="flex items-center justify-between gap-3 border-b border-outline-variant/60 bg-surface-container-low px-4 py-2"
    >
        <span class="flex items-center gap-2 font-mono text-xs text-on-surface-variant">
            <Icon name="lucide:file-code-2" size="14" />
            {filename}
        </span>
        <Tooltip text={clipboard.copied ? 'Copied' : 'Copy code'}>
            <Button
                variant="ghost"
                color="surface"
                size="xs"
                square
                icon={clipboard.copied ? 'lucide:check' : 'lucide:copy'}
                aria-label="Copy code"
                onclick={() => clipboard.copy(code)}
            />
        </Tooltip>
    </div>
    <pre
        class="p-4 font-mono text-[13px] leading-relaxed break-words whitespace-pre-wrap text-on-surface"><code
            >{code}</code
        ></pre>
</div>

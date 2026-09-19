<script lang="ts" generics="T">
    import type { Snippet } from 'svelte'
    import type { ClassNameValue } from 'tailwind-merge'
    import type { EventSnippetProps } from '../../types/snippet.types.js'
    import { twMerge } from 'tailwind-merge'

    interface Props {
        snippet: Snippet<[EventSnippetProps<T>]>
        props: EventSnippetProps<T>
        trigger: { onclick: () => void }
        class?: ClassNameValue
    }

    let { snippet, props, trigger, class: className }: Props = $props()
</script>

<div
    role="presentation"
    class={twMerge('contents', className)}
    data-sch-event-trigger
    onclick={trigger.onclick}
>
    {@render snippet(props)}
</div>

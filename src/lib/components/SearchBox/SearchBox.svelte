<script lang="ts" module>
    import type { SearchBoxProps } from './search-box.types.js'

    export type Props = SearchBoxProps
</script>

<script lang="ts">
    import { Input, Kbd, useKbd } from 'sv5ui'
    import { getComponentConfig } from '../../config.js'
    import { defaultLabels } from '../../core/i18n/labels.js'
    import { isTextField } from '../../interactions/hit-test.js'
    import { searchBoxDefaults, searchBoxVariants } from './search-box.variants.js'

    const config = getComponentConfig('searchBox', searchBoxDefaults)
    const slots = searchBoxVariants()

    let {
        ref = $bindable(null),
        value = $bindable(''),
        shortcut = '/',
        labels = defaultLabels,
        ui,
        class: className
    }: Props = $props()

    const classes = $derived({
        root: slots.root({ class: [config.slots.root, className, ui?.root] }),
        shortcut: slots.shortcut({ class: [config.slots.shortcut, ui?.shortcut] })
    })

    useKbd({
        preventDefault: false,
        enabled: () => shortcut !== null,
        shortcuts: () => (shortcut === null ? {} : { [shortcut]: focusField })
    })

    function focusField(event: KeyboardEvent) {
        if (!ref || isTextField(event.target)) return
        event.preventDefault()
        ref.focus()
    }
</script>

<Input
    bind:ref
    bind:value
    placeholder={labels.searchEvents}
    aria-label={labels.searchEvents}
    leadingIcon="lucide:search"
    size="sm"
    class={classes.root}
    data-sch-search-box
>
    {#snippet trailingSlot()}
        {#if shortcut !== null}
            <Kbd value={shortcut} size="sm" class={classes.shortcut} />
        {/if}
    {/snippet}
</Input>

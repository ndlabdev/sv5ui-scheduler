<script lang="ts" module>
    import type { ViewProps } from '../../types/extension.types.js'

    export type Props<T = unknown> = ViewProps<T>
</script>

<script lang="ts" generics="T">
    import TimeGrid from '../internal/TimeGrid.svelte'

    let props: Props<T> = $props()
</script>

<TimeGrid {...props} />

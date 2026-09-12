<script lang="ts" module>
    import type { ViewProps } from '../../types/extension.types.js'

    export type Props<T = unknown> = ViewProps<T>
</script>

<script lang="ts" generics="T">
    import MonthGrid from '../internal/MonthGrid.svelte'

    let props: Props<T> = $props()
</script>

<MonthGrid {...props} />

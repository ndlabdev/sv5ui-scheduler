<script lang="ts" module>
    import type { ViewProps } from '../../../types/view.types.js'

    export type Props<T = unknown> = ViewProps<T>
</script>

<script lang="ts" generics="T">
    import TimeGrid from '../TimeGrid/TimeGrid.svelte'

    let props: Props<T> = $props()
</script>

<TimeGrid {...props} />

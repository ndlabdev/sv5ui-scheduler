<script lang="ts" generics="T">
    import type { Snippet } from 'svelte'
    import type { SchedulerCalendar } from '../../../types/event.types.js'
    import type { DragSourceData } from '../../../types/interaction.types.js'
    import type { SidebarSnippetProps } from '../../../types/snippet.types.js'
    import CalendarList from '../CalendarList/CalendarList.svelte'
    import DateNavigator from '../DateNavigator/DateNavigator.svelte'
    import DragSourceList from '../DragSourceList/DragSourceList.svelte'
    import SearchBox from '../SearchBox/SearchBox.svelte'
    import { defaultSidebarVariants } from './default-sidebar.variants.js'

    interface Props {
        sidebar: SidebarSnippetProps<T>
        calendars: SchedulerCalendar[]
        hiddenCalendars: string[]
        search: string
        dragSources: DragSourceData<T>[]
        header?: Snippet<[SidebarSnippetProps<T>]>
        footer?: Snippet<[SidebarSnippetProps<T>]>
    }

    let {
        sidebar,
        calendars,
        hiddenCalendars = $bindable(),
        search = $bindable(),
        dragSources,
        header,
        footer
    }: Props = $props()

    const classes = defaultSidebarVariants()
</script>

<div class={classes.root()} data-sch-default-sidebar>
    {#if header}
        <div class={classes.header()}>
            {@render header(sidebar)}
        </div>
    {/if}
    <DateNavigator
        date={sidebar.date}
        events={sidebar.events}
        timeZone={sidebar.scheduler.timeZone}
        locale={sidebar.scheduler.locale}
        weekStartsOn={sidebar.scheduler.weekStartsOn}
        labels={sidebar.scheduler.labels}
        onSelect={(day) => sidebar.navigate(day)}
    />
    <SearchBox bind:value={search} labels={sidebar.scheduler.labels} />
    {#if calendars.length > 0}
        <CalendarList {calendars} bind:hiddenCalendars labels={sidebar.scheduler.labels} />
    {/if}
    {#if dragSources.length > 0}
        <DragSourceList items={dragSources} {calendars} labels={sidebar.scheduler.labels} />
    {/if}
    {#if footer}
        <div class={classes.footer()}>
            {@render footer(sidebar)}
        </div>
    {/if}
</div>

<script lang="ts" module>
    import type { SchedulerProps } from './scheduler.types.js'

    export type Props<T = unknown> = SchedulerProps<T>
</script>

<script lang="ts" generics="T">
    import { getLocalTimeZone, type ZonedDateTime } from '@internationalized/date'
    import type { Attachment } from 'svelte/attachments'
    import { ScrollArea, Skeleton, Slideover, useMediaQuery } from 'sv5ui'
    import { tick, untrack } from 'svelte'
    import { slide } from 'svelte/transition'
    import { getComponentConfig } from '../../config.js'
    import { announceConflict, announceReverted } from '../../core/a11y/announce.js'
    import { mergeLabels, viewLabel } from '../../core/i18n/labels.js'
    import { createRegistry } from '../../core/registry/registry.js'
    import { EventStore } from '../../core/store/event-store.svelte.js'
    import { createEventFilter } from '../../core/store/filters.js'
    import { MutationPipeline } from '../../core/store/mutations.svelte.js'
    import { createSourceLoader } from '../../core/store/sources.js'
    import { formatDayRange } from '../../core/time/format.js'
    import { eachDay } from '../../core/time/range.js'
    import { createTimeScale } from '../../core/time/scale.js'
    import { composeAttachments } from '../../interactions/attachments.js'
    import { createBuiltinInteractions } from '../../interactions/builtin.js'
    import { captureEvent, playReturn } from '../../interactions/motion.js'
    import type { SidebarSnippetProps } from '../../types/snippet.types.js'
    import type {
        PositionedEvent,
        SchedulerContext,
        StoreMiddleware,
        ViewProps
    } from '../../types/extension.types.js'
    import DefaultSidebar from '../internal/DefaultSidebar.svelte'
    import Toolbar from '../internal/Toolbar.svelte'
    import { syncBoundEvents } from './bound-events.svelte.js'
    import { createBuiltinViews } from './builtin-views.js'
    import { SchedulerClock } from './clock.svelte.js'
    import { InteractionState } from './interaction-state.svelte.js'
    import { LiveAnnouncer } from './live-announcer.svelte.js'
    import { SidebarState } from './sidebar-state.svelte.js'
    import { SourceLoading } from './source-loading.svelte.js'
    import { schedulerDefaults, schedulerVariants } from './scheduler.variants.js'

    const config = getComponentConfig('scheduler', schedulerDefaults)

    let {
        ref = $bindable(null),
        events = $bindable(),
        source,
        onLoadError,
        view = $bindable('week'),
        date = $bindable(),
        timeZone = getLocalTimeZone(),
        locale = 'en-US',
        weekStartsOn = 1,
        days: dayCount,
        hour12,
        businessHours,
        holidays = [],
        weekNumbers = false,
        calendars = [],
        hiddenCalendars = $bindable([]),
        search = $bindable(''),
        filter,
        labels: labelOverrides,
        slotMinutes = 30,
        slotHeight = 24,
        views = [],
        layouts = [],
        middleware = [],
        interactions = [],
        toolbar = true,
        creatable = true,
        sidebar = false,
        sidebarHeader,
        sidebarFooter,
        dragSources = [],
        sidebarOpen = $bindable(true),
        sidebarSide = 'start',
        sidebarBreakpoint = 1024,
        detailPopover = true,
        eventDetail,
        onMenu,
        toolbarActions,
        empty,
        onMutate,
        onConflict,
        onError,
        ui,
        class: className,
        dir,
        event: eventSnippet,
        cell,
        header,
        ...restProps
    }: Props<T> = $props()

    const clock = new SchedulerClock(() => timeZone)
    const announcer = new LiveAnnouncer()

    const mirrorToLoader: StoreMiddleware<T> = (next) => (patch) => {
        if (patch.type !== 'reset') loader?.apply(patch)
        next(patch)
    }
    const store = new EventStore<T>([...untrack(() => middleware), mirrorToLoader], () => ({
        weekStartsOn
    }))
    const interactionState: InteractionState<T> = new InteractionState<T>({
        root: () => ref,
        view: () => view,
        range: () => range,
        days: () => days,
        columnsPerRow: () => layoutContext.columnsPerRow,
        scale: () => scale,
        scheduler: () => context,
        slotMinutes: () => slotMinutes,
        creatable: () => creatable,
        store,
        commit: (request) => void pipeline.commit(request),
        step,
        navigate,
        announce: (message) => announcer.announce(message)
    })
    const pipeline = new MutationPipeline<T>({
        store,
        timeZone: () => timeZone,
        handlers: () => ({ onMutate, onConflict, onError }),
        willRevert: (mutation) => {
            returnToPlace(mutation.eventId)
            if (!mutation.before && interactionState.selectedEventId === mutation.eventId) {
                interactionState.selectedEventId = null
            }
            const subject = mutation.before ?? mutation.after
            if (subject) announcer.announce(announceReverted(subject, context))
        },
        willKeepServer: (_, server) => {
            returnToPlace(server.id)
            announcer.announce(announceConflict(server, context))
        }
    })
    syncBoundEvents({
        store,
        events: () => events,
        write: (next) => (events = next),
        timeZone: () => timeZone,
        enabled: () => !source
    })

    let inheritedDirection = $state<'ltr' | 'rtl'>('ltr')
    let rootWidth = $state(0)

    const anchor = $derived(date ?? clock.today)
    const labels = $derived(mergeLabels(labelOverrides))
    const builtinViews = createBuiltinViews<T>()
    const builtinInteractions = createBuiltinInteractions<T>(interactionState.gesture)
    const registry = $derived(
        createRegistry<T>({
            views: [...builtinViews, ...views],
            layouts,
            interactions: [...builtinInteractions, ...interactions]
        })
    )
    const definition = $derived(registry.view(view))
    const View = $derived(definition.component)
    const context: SchedulerContext = {
        get timeZone() {
            return timeZone
        },
        get locale() {
            return locale
        },
        get weekStartsOn() {
            return weekStartsOn
        },
        get dayCount() {
            return dayCount
        },
        get hour12() {
            return hour12
        },
        get businessHours() {
            return businessHours
        },
        get holidays() {
            return holidays
        },
        get calendars() {
            return calendars
        },
        get weekNumbers() {
            return weekNumbers
        },
        get direction() {
            return dir === 'rtl' || dir === 'ltr' ? dir : inheritedDirection
        },
        get labels() {
            return labels
        },
        get now() {
            return clock.now
        }
    }
    const range = $derived(definition.range(anchor, context))
    const days = $derived(eachDay(range))
    const scale = $derived(createTimeScale({ slotMinutes, slotHeight }))
    const title = $derived(
        definition.title?.(anchor, range, context) ?? formatDayRange(range, locale)
    )
    const eventFilter = $derived(createEventFilter({ hiddenCalendars, search, locale, filter }))
    const visibleEvents = $derived(store.query(range).filter(eventFilter))
    const viewItems = $derived(
        registry.views.map((v) => ({ value: v.name, label: viewLabel(labels, v.name) }))
    )
    const loader = $derived(source ? createSourceLoader(source, timeZone) : null)
    const sourceLoading = new SourceLoading<T>({
        loader: () => loader,
        range: () => range,
        store,
        onError: (error) => onLoadError?.(error)
    })

    const layoutContext = $derived({
        scale,
        days,
        columnsPerRow: definition.columnsPerRow ?? days.length,
        maxLanes: 3,
        scheduler: context
    })
    const positioned = $derived(
        registry.layout(definition.layout).layout(visibleEvents, range, layoutContext)
    )
    const viewPreview = $derived(
        interactionState.preview
            ? {
                  ...interactionState.preview,
                  positioned: registry
                      .layout(definition.layout)
                      .layout([interactionState.preview.event], range, layoutContext)
              }
            : null
    )

    const readDirection: Attachment<HTMLElement> = (node) => {
        inheritedDirection = getComputedStyle(node).direction === 'rtl' ? 'rtl' : 'ltr'
    }

    const gridAttachment = $derived(
        composeAttachments(
            registry.interactions.map((plugin) => plugin.attach(interactionState.context))
        )
    )

    const eventAttachment = $derived((position: PositionedEvent<T>): Attachment<HTMLElement> =>
        composeAttachments(
            registry.interactions.flatMap((plugin) =>
                plugin.attachEvent ? [plugin.attachEvent(interactionState.context, position)] : []
            )
        )
    )

    const viewInteractions: ViewProps<T>['interactions'] = $derived({
        grid: gridAttachment,
        event: eventAttachment
    })

    const snippets: ViewProps<T>['snippets'] = $derived({
        event: eventSnippet,
        cell,
        header,
        empty,
        detail: eventDetail
    })

    function returnToPlace(eventId: string) {
        const root = ref
        if (!root) return
        const from = captureEvent(root, eventId)
        void tick().then(() => {
            if (ref === root) playReturn(root, eventId, from)
        })
    }

    const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
    const panel = new SidebarState({
        width: () => rootWidth,
        breakpoint: () => sidebarBreakpoint,
        open: () => sidebarOpen,
        setOpen: (open) => (sidebarOpen = open),
        reducedMotion: () => reducedMotion.matches
    })
    const allEvents = $derived.by(() => {
        void store.version
        return store.all().filter(eventFilter)
    })
    const sidebarProps: SidebarSnippetProps<T> = {
        get date() {
            return anchor
        },
        get view() {
            return view
        },
        get range() {
            return range
        },
        get events() {
            return allEvents
        },
        get scheduler() {
            return context
        },
        get docked() {
            return panel.docked
        },
        navigate: (next, name) => {
            navigate(next, name)
            panel.afterNavigate()
        },
        close: () => panel.close()
    }
    const slideoverSide = $derived(
        (sidebarSide === 'start') === (context.direction === 'ltr') ? 'left' : 'right'
    )

    function toggleSidebar() {
        if (sidebar) panel.toggle()
        onMenu?.()
    }

    function selectEvent(eventId: string | null) {
        interactionState.selectedEventId = eventId
    }

    function deleteEvent(eventId: string) {
        const before = store.get(eventId)
        if (!before || before.editable === false) return
        void pipeline.commit({ kind: 'delete', eventId, before, after: null })
        if (interactionState.selectedEventId === eventId) interactionState.selectedEventId = null
        announcer.announce(labels.announce.deleted(before))
    }

    function navigate(next: ZonedDateTime, name?: string) {
        date = next
        if (name && registry.hasView(name)) view = name
    }

    function step(direction: 1 | -1) {
        date = definition.step(anchor, direction, context)
    }

    function goToday() {
        date = clock.today
    }

    function setView(name: string) {
        if (registry.hasView(name)) view = name
    }

    const overrides = $derived(ui ?? {})

    const classes = $derived.by(() => {
        const slots = schedulerVariants()
        return {
            root: slots.root({ class: [config.slots.root, className, overrides.root] }),
            toolbar: slots.toolbar({ class: [config.slots.toolbar, overrides.toolbar] }),
            body: slots.body({
                class: [
                    config.slots.body,
                    overrides.body,
                    sidebarSide === 'end' ? slots.bodyReversed() : ''
                ]
            }),
            sidebar: slots.sidebar({
                class: [
                    config.slots.sidebar,
                    overrides.sidebar,
                    sidebarSide === 'end' ? slots.sidebarEnd() : ''
                ]
            }),
            sidebarScroll: slots.sidebarScroll({
                class: [config.slots.sidebarScroll, overrides.sidebarScroll]
            }),
            slideover: slots.slideover({ class: [config.slots.slideover, overrides.slideover] }),
            view: slots.view({ class: [config.slots.view, overrides.view] }),
            loading: slots.loading({ class: [config.slots.loading, overrides.loading] })
        }
    })
</script>

<div
    bind:this={ref}
    {...restProps}
    {dir}
    {@attach readDirection}
    bind:clientWidth={rootWidth}
    class={classes.root}
    data-sch-scheduler
    data-sch-view={view}
    onscrollcapture={() => interactionState.invalidateColumns()}
>
    {#if toolbar}
        <Toolbar
            {title}
            {view}
            views={viewItems}
            {labels}
            class={classes.toolbar}
            onToday={goToday}
            onStep={step}
            onView={setView}
            onMenu={sidebar || onMenu ? toggleSidebar : undefined}
            menuOpen={sidebar ? panel.expanded : undefined}
            actions={toolbarActions}
        />
    {/if}
    <div class={classes.body}>
        {#if sidebar && panel.docked && sidebarOpen}
            <aside
                class={classes.sidebar}
                data-sch-sidebar
                transition:slide={panel.transition()}
                onintroend={() => panel.settled()}
                onoutroend={() => panel.settled()}
            >
                <ScrollArea class={classes.sidebarScroll} dir={context.direction}>
                    {@render sidebarContent()}
                </ScrollArea>
            </aside>
        {/if}
        <div class={classes.view}>
            <View
                {view}
                {anchor}
                {range}
                events={visibleEvents}
                scheduler={context}
                {scale}
                {positioned}
                {snippets}
                preview={viewPreview}
                focus={interactionState.focus}
                selectedEventId={interactionState.selectedEventId}
                onSelectEvent={selectEvent}
                {detailPopover}
                onDeleteEvent={deleteEvent}
                {navigate}
                interactions={viewInteractions}
            />
            {#if sourceLoading.loading}
                <div class={classes.loading} aria-busy="true">
                    <Skeleton class="h-full w-full" />
                </div>
            {/if}
        </div>
    </div>
    {#if sidebar && !panel.docked}
        <Slideover
            bind:open={panel.overlayOpen}
            side={slideoverSide}
            title={labels.menu}
            ui={{ content: classes.slideover }}
        >
            {#snippet body()}
                <div data-sch-sidebar>
                    {@render sidebarContent()}
                </div>
            {/snippet}
        </Slideover>
    {/if}
    <div class="sr-only" aria-live="polite" aria-atomic="true">{announcer.message}</div>
</div>

{#snippet sidebarContent()}
    {#if sidebar === true}
        <DefaultSidebar
            sidebar={sidebarProps}
            {calendars}
            bind:hiddenCalendars
            bind:search
            {dragSources}
            header={sidebarHeader}
            footer={sidebarFooter}
        />
    {:else if sidebar}
        {@render sidebar(sidebarProps)}
    {/if}
{/snippet}

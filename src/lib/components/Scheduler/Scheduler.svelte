<script lang="ts" module>
    import type { SchedulerProps } from './scheduler.types.js'

    export type Props<T = unknown> = SchedulerProps<T>
</script>

<script lang="ts" generics="T">
    import { getLocalTimeZone, type ZonedDateTime } from '@internationalized/date'
    import type { Attachment } from 'svelte/attachments'
    import { Progress, ScrollArea, Slideover, useMediaQuery } from 'sv5ui'
    import { tick, untrack } from 'svelte'
    import { slide } from 'svelte/transition'
    import { getComponentConfig } from '../../config/config.js'
    import { announceConflict, announceReverted } from '../../core/a11y/announce.js'
    import { mergeLabels, viewLabel } from '../../core/i18n/labels.js'
    import { createRegistry } from '../../core/registry/registry.js'
    import { EventStore } from '../../core/store/event-store.svelte.js'
    import { createEventFilter } from '../../core/store/filters.js'
    import { isEditable, isSameEvent, normalizeEvent } from '../../core/store/normalize.js'
    import { MutationPipeline } from '../../core/store/mutations.svelte.js'
    import { createSourceLoader } from '../../core/store/sources.js'
    import { formatDayRange } from '../../core/time/format.js'
    import {
        normalizeHiddenDays,
        visibleColumns,
        visibleDays,
        visibleRange
    } from '../../core/time/hidden-days.js'
    import { eachDay } from '../../core/time/range.js'
    import { createTimeScale } from '../../core/time/scale.js'
    import { slotSelection } from '../../interactions/engine/gesture.js'
    import { toZoned } from '../../core/time/zone.js'
    import { composeAttachments } from '../../interactions/engine/attachments.js'
    import { createBuiltinInteractions } from '../../interactions/plugins/builtin.js'
    import { captureEvent, playReturn } from '../../interactions/engine/motion.js'
    import type { SidebarSnippetProps, ToolbarSnippetProps } from '../../types/snippet.types.js'
    import type { PositionedEvent } from '../../types/layout.types.js'
    import type { SchedulerContext } from '../../types/context.types.js'
    import type { EventChanges, NewEventInput, SchedulerEvent } from '../../types/event.types.js'
    import type { SlotSelection } from '../../types/interaction.types.js'
    import type { StoreMiddleware } from '../../types/mutation.types.js'
    import type { ViewProps } from '../../types/view.types.js'
    import DefaultSidebar from '../sidebar/DefaultSidebar/DefaultSidebar.svelte'
    import Toolbar from './parts/Toolbar.svelte'
    import { syncBoundEvents } from './state/bound-events.svelte.js'
    import CreatePanel from '../event/CreatePanel/CreatePanel.svelte'
    import EventPanel from '../event/EventPanel/EventPanel.svelte'
    import { createBuiltinViews } from '../views/builtin.js'
    import { SchedulerClock } from './state/clock.svelte.js'
    import { InteractionState } from './state/interaction-state.svelte.js'
    import { LiveAnnouncer } from './state/live-announcer.svelte.js'
    import { SidebarState } from './state/sidebar-state.svelte.js'
    import { SourceLoading } from './state/source-loading.svelte.js'
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
        hiddenDays = [],
        calendars = [],
        hiddenCalendars = $bindable([]),
        search = $bindable(''),
        filter,
        labels: labelOverrides,
        slotMinutes = 30,
        slotHeight = 24,
        dayStartHour = 0,
        dayEndHour = 24,
        views = [],
        layouts = [],
        middleware = [],
        interactions = [],
        toolbar = true,
        creatable = true,
        editable = true,
        onEventClick,
        onSelectSlot,
        createPanel,
        draft = $bindable(null),
        sidebar = false,
        sidebarHeader,
        sidebarFooter,
        dragSources = [],
        sidebarOpen = $bindable(true),
        sidebarSide = 'start',
        sidebarBreakpoint = 1024,
        compactBreakpoint = 640,
        compactDays = 3,
        detail = 'popover',
        eventDetail,
        eventPanel,
        onMenu,
        toolbarActions,
        empty,
        onMutate,
        onConflict,
        onError,
        ui,
        class: className,
        dir,
        height,
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
        weekStartsOn,
        timeZone
    }))
    const interactionState: InteractionState<T> = new InteractionState<T>({
        root: () => ref,
        view: () => view,
        viewLabel: () => viewItems.find((item) => item.value === view)?.label ?? view,
        range: () => range,
        days: () => days,
        columnsPerRow: () => layoutContext.columnsPerRow,
        scale: () => scale,
        scheduler: () => context,
        slotMinutes: () => slotMinutes,
        creatable: () => creatable,
        proposeCreate: () => createPanel !== undefined,
        selectSlot: (point) => onSelectSlot?.(slotSelection(point, slotMinutes)),
        selectRange: proposeRange,
        store,
        events: () => visibleEvents,
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
    const compact = $derived(rootWidth > 0 && rootWidth < compactBreakpoint)
    const detailMode = $derived(detail === 'popover' && compact ? 'slideover' : detail)

    const anchor = $derived(date ? toZoned(date, timeZone) : clock.today)
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
            return dayCount ?? (compact && compactDays ? compactDays : undefined)
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
        get hiddenDays() {
            return hidden
        },
        get editable() {
            return editable
        },
        get direction() {
            return dir === 'rtl' || dir === 'ltr' ? dir : inheritedDirection
        },
        get compact() {
            return compact
        },
        get labels() {
            return labels
        },
        get now() {
            return clock.now
        }
    }
    const range = $derived(definition.range(anchor, context))
    const hidden = $derived(normalizeHiddenDays(hiddenDays))
    const allDays = $derived(eachDay(range))
    const days = $derived(definition.layout === 'list' ? allDays : visibleDays(allDays, hidden))
    const scale = $derived(
        createTimeScale({ slotMinutes, slotHeight, startHour: dayStartHour, endHour: dayEndHour })
    )
    const shownRange = $derived(visibleRange(range, days))
    const title = $derived(
        (compact ? definition.shortTitle?.(anchor, shownRange, context) : undefined) ??
            definition.title?.(anchor, shownRange, context) ??
            formatDayRange(shownRange, locale)
    )
    const eventFilter = $derived(createEventFilter({ hiddenCalendars, search, locale, filter }))
    const visibleEvents = $derived(store.query(range).filter(eventFilter))
    const viewItems = $derived(
        registry.views.map((v) => ({ value: v.name, label: v.label ?? viewLabel(labels, v.name) }))
    )
    const loader = $derived(source ? createSourceLoader(source, () => timeZone) : null)
    const sourceLoading = new SourceLoading<T>({
        loader: () => loader,
        range: () => range,
        store,
        onError: (error) => onLoadError?.(error)
    })

    const layoutContext = $derived({
        scale,
        days,
        columnsPerRow: visibleColumns(definition.columnsPerRow, days.length, allDays.length),
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
    const toolbarProps: ToolbarSnippetProps = {
        get title() {
            return title
        },
        get date() {
            return anchor
        },
        get range() {
            return range
        },
        get view() {
            return view
        },
        get views() {
            return viewItems.map((item) => ({ name: item.value, label: item.label }))
        },
        get scheduler() {
            return context
        },
        get sidebarOpen() {
            return panel.expanded
        },
        get compact() {
            return compact
        },
        step,
        today: goToday,
        navigate,
        setView,
        toggleSidebar
    }
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

    let panelEvent = $state.raw<SchedulerEvent<T> | null>(null)
    let panelOpen = $state(false)
    const currentPanelEvent = $derived(panelEvent ? findEvent(panelEvent.id) : null)
    const panelSide = $derived(context.direction === 'rtl' ? 'left' : 'right')

    function findEvent(eventId: string) {
        return visibleEvents.find((item) => item.id === eventId) ?? store.get(eventId) ?? null
    }

    function selectEvent(eventId: string | null) {
        interactionState.selectedEventId = eventId
        const clicked = eventId === null ? null : findEvent(eventId)
        if (!clicked) return
        onEventClick?.(clicked)
        if (detailMode !== 'slideover') return
        panelEvent = clicked
        panelOpen = true
    }

    function closePanel() {
        panelOpen = false
    }

    function openPanel(eventId: string) {
        const target = findEvent(eventId)
        if (!target) return
        panelEvent = target
        panelOpen = true
    }

    function proposeRange(selection: SlotSelection) {
        onSelectSlot?.(selection)
        if (createPanel) draft = selection
    }

    function closeDraft() {
        draft = null
    }

    function createEvent(input: NewEventInput<T>) {
        const after = normalizeEvent(
            { ...input, id: input.id ?? interactionState.nextEventId() },
            timeZone
        )
        void pipeline.commit({ kind: 'create', eventId: after.id, before: null, after })
        announcer.announce(labels.announce.created(after))
    }

    function updateEvent(eventId: string, changes: EventChanges<T>) {
        const before = store.get(eventId)
        if (!before || !isEditable(before, editable)) return
        const after = normalizeEvent({ ...before, ...changes, id: eventId }, timeZone)
        if (isSameEvent(before, after)) return
        void pipeline.commit({ kind: 'update', eventId, before, after })
        announcer.announce(labels.announce.updated(after))
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
            slideoverOverlay: slots.slideoverOverlay({
                class: [config.slots.slideoverOverlay, overrides.slideoverOverlay]
            }),
            slideover: slots.slideover({ class: [config.slots.slideover, overrides.slideover] }),
            detailPanel: slots.detailPanel({
                class: [config.slots.detailPanel, overrides.detailPanel]
            }),
            slideoverBody: slots.slideoverBody({
                class: [config.slots.slideoverBody, overrides.slideoverBody]
            }),
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
    style:height={typeof height === 'number' ? `${height}px` : height}
    data-sch-scheduler
    data-sch-view={view}
    onscrollcapture={() => interactionState.invalidateColumns()}
>
    {#if toolbar === true}
        <Toolbar
            {title}
            {view}
            views={viewItems}
            {labels}
            {compact}
            class={classes.toolbar}
            onToday={goToday}
            onStep={step}
            onView={setView}
            onMenu={sidebar || onMenu ? toggleSidebar : undefined}
            menuOpen={sidebar ? panel.expanded : undefined}
            actions={toolbarActions}
        />
    {:else if toolbar}
        {@render toolbar(toolbarProps)}
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
                {days}
                columnsPerRow={layoutContext.columnsPerRow}
                events={visibleEvents}
                scheduler={context}
                {scale}
                {positioned}
                {snippets}
                preview={viewPreview}
                focus={interactionState.focus}
                selectedEventId={interactionState.selectedEventId}
                onSelectEvent={selectEvent}
                detailPopover={detailMode === 'popover'}
                onDeleteEvent={deleteEvent}
                onOpenEvent={eventPanel && detailMode === 'popover' ? openPanel : undefined}
                {navigate}
                interactions={viewInteractions}
                loading={sourceLoading.pending}
            />
            {#if sourceLoading.loading}
                <div class={classes.loading} aria-busy="true">
                    <Progress size="xs" />
                </div>
            {/if}
        </div>
    </div>
    {#if sidebar && !panel.docked}
        <Slideover
            bind:open={panel.overlayOpen}
            side={slideoverSide}
            title={labels.sidebar}
            portal={false}
            preventScroll={false}
            ui={{
                overlay: classes.slideoverOverlay,
                content: classes.slideover,
                body: classes.slideoverBody
            }}
        >
            {#snippet body()}
                <div data-sch-sidebar>
                    {@render sidebarContent()}
                </div>
            {/snippet}
        </Slideover>
    {/if}
    {#if createPanel}
        <CreatePanel
            {draft}
            scheduler={context}
            side={panelSide}
            overlayClass={classes.slideoverOverlay}
            contentClass={classes.detailPanel}
            panel={createPanel}
            onClose={closeDraft}
            onCreate={createEvent}
        />
    {/if}
    {#if panelEvent && (detailMode === 'slideover' || eventPanel)}
        <EventPanel
            event={currentPanelEvent ?? panelEvent}
            open={panelOpen && currentPanelEvent !== null}
            scheduler={context}
            side={panelSide}
            overlayClass={classes.slideoverOverlay}
            contentClass={classes.detailPanel}
            detail={eventDetail}
            panel={eventPanel}
            onClose={closePanel}
            onDelete={deleteEvent}
            onUpdate={updateEvent}
        />
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

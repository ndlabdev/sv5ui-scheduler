<script lang="ts" module>
    import type { SchedulerProps } from './scheduler.types.js'

    export type Props<T = unknown> = SchedulerProps<T>
</script>

<script lang="ts" generics="T">
    import { getLocalTimeZone } from '@internationalized/date'
    import type { Attachment } from 'svelte/attachments'
    import { Skeleton } from 'sv5ui'
    import { untrack } from 'svelte'
    import { getComponentConfig } from '../../config.js'
    import { mergeLabels, viewLabel } from '../../core/i18n/labels.js'
    import { createRegistry } from '../../core/registry/registry.js'
    import { EventStore } from '../../core/store/event-store.svelte.js'
    import { MutationPipeline } from '../../core/store/mutations.svelte.js'
    import { isSameEvent, normalizeEvents } from '../../core/store/normalize.js'
    import { createSourceLoader } from '../../core/store/sources.js'
    import { formatDayRange } from '../../core/time/format.js'
    import { eachDay } from '../../core/time/range.js'
    import { createTimeScale } from '../../core/time/scale.js'
    import { nowIn, toZoned } from '../../core/time/zone.js'
    import { composeAttachments } from '../../interactions/attachments.js'
    import { createBuiltinInteractions } from '../../interactions/builtin.js'
    import { GestureController } from '../../interactions/controller.svelte.js'
    import { collectColumnRects, resolveHit } from '../../interactions/hit-test.js'
    import { snapToSlot } from '../../interactions/snap.js'
    import type { SchedulerEvent } from '../../types/event.types.js'
    import type {
        GridFocus,
        InteractionContext,
        InteractionPreview,
        PositionedEvent,
        SchedulerContext,
        ViewProps
    } from '../../types/extension.types.js'
    import Toolbar from '../internal/Toolbar.svelte'
    import { createBuiltinViews } from './builtin-views.js'
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
        hour12,
        businessHours,
        holidays = [],
        labels: labelOverrides,
        slotMinutes = 30,
        slotHeight = 24,
        views = [],
        layouts = [],
        middleware = [],
        interactions = [],
        toolbar = true,
        onMenu,
        toolbarActions,
        banner,
        empty,
        onMutate,
        onConflict,
        onError,
        ui,
        class: className,
        event: eventSnippet,
        cell,
        header,
        ...restProps
    }: Props<T> = $props()

    const store = new EventStore<T>(
        untrack(() => middleware),
        () => ({ weekStartsOn })
    )
    const pipeline = new MutationPipeline<T>({
        store,
        timeZone: () => timeZone,
        handlers: () => ({ onMutate, onConflict, onError })
    })
    let mirrored = normalizeEvents(
        untrack(() => events) ?? [],
        untrack(() => timeZone)
    )
    store.apply({ type: 'reset', events: mirrored })

    let clock = $state(nowIn(untrack(() => timeZone)))
    let selectedEventId = $state<string | null>(null)
    let preview = $state.raw<InteractionPreview<T> | null>(null)
    let focus = $state.raw<GridFocus | null>(null)
    let createdIds = 0
    let announcement = $state('')
    let loading = $state(false)
    let gridNode: HTMLElement | null = null

    const now = $derived(toZoned(clock, timeZone))
    const anchor = $derived(date ?? now)
    const labels = $derived(mergeLabels(labelOverrides))
    const builtinViews = createBuiltinViews<T>()
    const gesture = new GestureController<T>(
        () => interactionContext,
        () => ({ defaultMinutes: slotMinutes * 2 })
    )
    const builtinInteractions = createBuiltinInteractions<T>(gesture)
    const registry = $derived(
        createRegistry<T>({
            views: [...builtinViews, ...views],
            layouts,
            interactions: [...builtinInteractions, ...interactions]
        })
    )
    const definition = $derived(registry.view(view))
    const View = $derived(definition.component)
    const context: SchedulerContext = $derived({
        timeZone,
        locale,
        weekStartsOn,
        hour12,
        businessHours,
        holidays,
        labels,
        now
    })
    const range = $derived(definition.range(anchor, context))
    const days = $derived(eachDay(range))
    const scale = $derived(createTimeScale({ slotMinutes, slotHeight }))
    const title = $derived(
        definition.title?.(anchor, range, context) ?? formatDayRange(range, locale)
    )
    const visibleEvents = $derived(store.query(range))
    const viewItems = $derived(
        registry.views.map((v) => ({ value: v.name, label: viewLabel(labels, v.name) }))
    )
    const loader = $derived(source ? createSourceLoader(source, timeZone) : null)

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
        preview
            ? {
                  ...preview,
                  positioned: registry
                      .layout(definition.layout)
                      .layout([preview.event], range, layoutContext)
              }
            : null
    )

    const interactionContext: InteractionContext<T> = {
        get view() {
            return view
        },
        get range() {
            return range
        },
        get days() {
            return days
        },
        get scale() {
            return scale
        },
        get scheduler() {
            return context
        },
        get selectedEventId() {
            return selectedEventId
        },
        get focus() {
            return focus
        },
        select: (eventId) => (selectedEventId = eventId),
        setFocus: (next) => (focus = next),
        step: (direction) => step(direction),
        newEventId: () => `event-${Date.now().toString(36)}-${++createdIds}`,
        hitTest: (clientX, clientY) =>
            gridNode
                ? resolveHit({
                      clientX,
                      clientY,
                      columns: collectColumnRects(gridNode),
                      days,
                      scale
                  })
                : null,
        snap: (value) => snapToSlot(value, slotMinutes),
        getEvent: (eventId) => store.get(eventId),
        commit: (request) => void pipeline.commit(request),
        setPreview: (next) => (preview = next),
        announce: (message) => (announcement = message)
    }

    const rememberGrid: Attachment<HTMLElement> = (node) => {
        gridNode = node
        return () => {
            if (gridNode === node) gridNode = null
        }
    }

    const gridAttachment = $derived(
        composeAttachments([
            rememberGrid,
            ...registry.interactions.map((plugin) => plugin.attach(interactionContext))
        ])
    )

    const eventAttachment = $derived((position: PositionedEvent<T>): Attachment<HTMLElement> =>
        composeAttachments(
            registry.interactions.flatMap((plugin) =>
                plugin.attachEvent ? [plugin.attachEvent(interactionContext, position)] : []
            )
        )
    )

    const viewInteractions: ViewProps<T>['interactions'] = $derived({
        grid: gridAttachment,
        event: eventAttachment
    })

    const viewProps: Omit<ViewProps<T>, 'interactions'> = $derived({
        view,
        anchor,
        range,
        events: visibleEvents,
        scheduler: context,
        scale,
        positioned,
        snippets: { event: eventSnippet, cell, header, empty },
        preview: viewPreview,
        focus,
        selectedEventId,
        onSelectEvent: (eventId) => (selectedEventId = eventId)
    })

    const classes = $derived.by(() => {
        const slots = schedulerVariants()
        return {
            root: slots.root({ class: [config.slots.root, className, ui?.root] }),
            toolbar: slots.toolbar({ class: [config.slots.toolbar, ui?.toolbar] }),
            view: slots.view({ class: [config.slots.view, ui?.view] }),
            loading: slots.loading({ class: [config.slots.loading, ui?.loading] })
        }
    })

    function sameEvents(a: SchedulerEvent<T>[], b: SchedulerEvent<T>[]): boolean {
        if (a.length !== b.length) return false
        const byId = new Map(b.map((event) => [event.id, event]))
        return a.every((event) => {
            const other = byId.get(event.id)
            return other !== undefined && isSameEvent(other, event) && other.data === event.data
        })
    }

    $effect(() => {
        if (source) return
        const normalized = normalizeEvents(events ?? [], timeZone)
        untrack(() => {
            if (sameEvents(normalized, mirrored)) return
            mirrored = normalized
            store.apply({ type: 'reset', events: normalized })
        })
    })

    $effect(() => {
        void store.version
        if (source) return
        untrack(() => {
            const all = store.all()
            if (sameEvents(all, mirrored)) return
            mirrored = all
            events = all
        })
    })

    $effect(() => {
        const current = loader
        const visible = range
        if (!current) return
        current.load(visible).then(
            (result) => {
                if (result.status === 'loaded')
                    store.apply({ type: 'reset', events: result.events })
            },
            (error) => onLoadError?.(error)
        )
    })

    $effect(() => {
        const zone = timeZone
        const id = setInterval(() => (clock = nowIn(zone)), 60000)
        return () => clearInterval(id)
    })

    function step(direction: 1 | -1) {
        date = definition.step(anchor, direction, context)
    }

    function today() {
        date = now
    }

    function setView(name: string) {
        if (registry.hasView(name)) view = name
    }
</script>

<div bind:this={ref} {...restProps} class={classes.root} data-sch-scheduler data-sch-view={view}>
    {#if toolbar}
        <Toolbar
            {title}
            {view}
            views={viewItems}
            {labels}
            class={classes.toolbar}
            onToday={today}
            onStep={step}
            onView={setView}
            {onMenu}
            actions={toolbarActions}
        />
    {/if}
    {@render banner?.()}
    <div class={classes.view}>
        <View
            view={viewProps.view}
            anchor={viewProps.anchor}
            range={viewProps.range}
            events={viewProps.events}
            scheduler={viewProps.scheduler}
            scale={viewProps.scale}
            positioned={viewProps.positioned}
            snippets={viewProps.snippets}
            preview={viewProps.preview}
            focus={viewProps.focus}
            selectedEventId={viewProps.selectedEventId}
            onSelectEvent={viewProps.onSelectEvent}
            interactions={viewInteractions}
        />
        {#if loading}
            <div class={classes.loading} aria-busy="true">
                <Skeleton class="h-full w-full" />
            </div>
        {/if}
    </div>
    <div class="sr-only" aria-live="polite" aria-atomic="true">{announcement}</div>
</div>

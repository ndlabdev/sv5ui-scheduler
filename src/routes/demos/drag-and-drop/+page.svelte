<script lang="ts">
    import { Badge, FormField, Icon, Switch, toast } from 'sv5ui'
    import {
        Scheduler,
        dragSource,
        type DragSourceData,
        type EventInput,
        type Mutation
    } from '$lib/index.js'
    import DemoCard from '../../../demo/DemoCard.svelte'
    import LogPanel from '../../../demo/LogPanel.svelte'
    import PageHeader from '../../../demo/PageHeader.svelte'
    import { EventLog } from '../../../demo/log.svelte.js'
    import { calendars, teamEvents, timeAt, timeZone, todayOffset } from '../../../demo/data.js'
    import { MUTATION_COLORS, describeMutation } from '../../../demo/format.js'

    let events = $state<EventInput[]>([
        ...teamEvents(),
        {
            id: 'board',
            title: 'Board meeting (locked)',
            calendarId: 'work',
            start: timeAt(todayOffset, '16:00'),
            end: timeAt(todayOffset, '17:00'),
            editable: false
        }
    ])
    let creatable = $state(true)
    const log = new EventLog()

    let planned = $state<EventInput[]>([])

    const tasks: { data: DragSourceData; icon: string; estimate: string }[] = [
        {
            data: { title: 'Write release notes', durationMinutes: 60, calendarId: 'work' },
            icon: 'lucide:file-text',
            estimate: '1 hour'
        },
        {
            data: { title: 'Review pull requests', durationMinutes: 90, calendarId: 'team' },
            icon: 'lucide:git-pull-request',
            estimate: '1 hour 30 min'
        },
        {
            data: { title: 'Plan the offsite', durationMinutes: 45, calendarId: 'travel' },
            icon: 'lucide:map',
            estimate: '45 min'
        },
        {
            data: { title: 'Renew passport', calendarId: 'personal' },
            icon: 'lucide:id-card',
            estimate: 'Two slots'
        }
    ]

    function onMutate(mutation: Mutation) {
        log.add(mutation.kind, describeMutation(mutation), MUTATION_COLORS[mutation.kind])
    }

    function onPlanned(mutation: Mutation) {
        if (mutation.kind === 'create' && mutation.after) {
            toast(`${mutation.after.title} scheduled`, {
                color: 'success',
                icon: 'lucide:calendar-check',
                description: describeMutation(mutation)
            })
        }
    }

    const code = `<Scheduler bind:events {creatable} {onMutate} />

<button {@attach dragSource(() => ({ title: 'Write release notes', durationMinutes: 60 }))}>
    Write release notes
</button>`
</script>

<div class="mx-auto max-w-[1600px] space-y-10 px-4 py-8 sm:px-6 lg:px-8">
    <PageHeader
        icon="lucide:move"
        badge="Interaction"
        title="Drag and drop"
        description="Drag on empty slots to create, drag events to move them and pull their edges to resize. Events can be locked, creation can be switched off, and any element on the page can become a drag source."
    />

    <DemoCard
        title="Create, move and resize"
        description="Every gesture goes through the mutation pipeline and is reported to onMutate. The board meeting is locked with editable: false, so it cannot be dragged or resized."
        {code}
        height="h-[720px]"
    >
        {#snippet controls()}
            <FormField label="Create by dragging">
                <Switch bind:checked={creatable} />
            </FormField>
        {/snippet}
        {#snippet aside()}
            <LogPanel {log} title="onMutate calls" />
        {/snippet}
        <Scheduler bind:events {timeZone} {calendars} {creatable} {onMutate} class="h-full" />
    </DemoCard>

    <DemoCard
        title="Drop from your own list"
        description="These cards are plain buttons with the dragSource attachment. Drop one on a time slot for its duration, or on the all-day row of the month view for a whole day."
        height="h-[640px]"
    >
        {#snippet aside()}
            <div class="flex h-full flex-col gap-3">
                <div class="flex items-center justify-between">
                    <span class="text-sm font-semibold text-on-surface">Backlog</span>
                    <Badge label="{tasks.length} tasks" size="sm" variant="soft" color="surface" />
                </div>
                {#each tasks as task (task.data.title)}
                    <button
                        type="button"
                        class="flex w-full items-center gap-3 rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-3 text-start transition-colors hover:border-primary/50 hover:bg-primary/5"
                        {@attach dragSource(() => task.data)}
                    >
                        <span
                            class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-container-high text-on-surface"
                        >
                            <Icon name={task.icon} size="18" />
                        </span>
                        <span class="min-w-0 flex-1">
                            <span class="block truncate text-sm font-medium text-on-surface">
                                {task.data.title}
                            </span>
                            <span class="block text-xs text-on-surface-variant"
                                >{task.estimate}</span
                            >
                        </span>
                        <Icon
                            name="lucide:grip-vertical"
                            size="16"
                            class="text-on-surface-variant"
                        />
                    </button>
                {/each}
            </div>
        {/snippet}
        <Scheduler
            bind:events={planned}
            {timeZone}
            {calendars}
            creatable={false}
            onMutate={onPlanned}
            class="h-full"
        />
    </DemoCard>
</div>

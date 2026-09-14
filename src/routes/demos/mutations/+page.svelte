<script lang="ts">
    import { FormField, Select, Slider, toast } from 'sv5ui'
    import {
        Scheduler,
        type ConflictResolution,
        type EventInput,
        type Mutation,
        type MutationResult,
        type SchedulerEvent
    } from '$lib/index.js'
    import DemoCard from '../../../demo/DemoCard.svelte'
    import LogPanel from '../../../demo/LogPanel.svelte'
    import PageHeader from '../../../demo/PageHeader.svelte'
    import { EventLog } from '../../../demo/log.svelte.js'
    import { calendars, teamEvents, timeZone } from '../../../demo/data.js'
    import { describeMutation } from '../../../demo/format.js'

    let events = $state<EventInput[]>(teamEvents())
    let behavior = $state('accept')
    let resolution = $state('keep-server')
    let latency = $state(800)
    const log = new EventLog()

    const behaviorItems = [
        { label: 'Accept every change', value: 'accept' },
        { label: 'Reject every change', value: 'reject' },
        { label: 'Answer with its own version', value: 'conflict' },
        { label: 'Fail one change in three', value: 'random' }
    ]

    const resolutionItems = [
        { label: 'Keep the server version', value: 'keep-server' },
        { label: 'Keep my change', value: 'keep-local' }
    ]

    function wait(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms))
    }

    function fails(): boolean {
        return behavior === 'reject' || (behavior === 'random' && Math.random() < 1 / 3)
    }

    async function onMutate(mutation: Mutation): Promise<MutationResult> {
        log.add('sent', describeMutation(mutation), 'info')
        await wait(latency)
        if (fails()) {
            log.add('rejected', describeMutation(mutation), 'error')
            throw new Error('The server rejected the change')
        }
        if (behavior === 'conflict' && mutation.after) {
            log.add('conflict', `The server renamed ${mutation.after.title}`, 'warning')
            return { ...mutation.after, title: `${mutation.after.title} (server)` }
        }
        log.add('saved', describeMutation(mutation), 'success')
        return undefined
    }

    function onConflict(mutation: Mutation, server: SchedulerEvent): ConflictResolution {
        const choice = resolution === 'keep-local' ? 'keep-local' : 'keep-server'
        log.add(choice, server.title, 'tertiary')
        return choice
    }

    function onError(mutation: Mutation) {
        toast('Change rolled back', {
            color: 'error',
            icon: 'lucide:undo-2',
            description: describeMutation(mutation)
        })
    }

    const code = `<Scheduler
    bind:events
    onMutate={async (mutation) => {
        const saved = await api.save(mutation)
        return saved
    }}
    onConflict={(mutation, server) => 'keep-server'}
    onError={(mutation, error) => toast.error(String(error))}
/>`
</script>

<div class="mx-auto max-w-[1600px] space-y-10 px-4 py-8 sm:px-6 lg:px-8">
    <PageHeader
        icon="lucide:server"
        badge="Data"
        title="Mutations"
        description="Changes appear immediately. The scheduler then waits for onMutate: a rejection rolls the event back with an animation, and a different answer from the server goes to onConflict. Changes to different events never wait for each other."
    />

    <DemoCard
        title="A simulated server"
        description="Choose how the server behaves, then move, resize, create or delete events. Try dragging two events quickly with a long delay: each has its own queue."
        {code}
        height="h-[720px]"
    >
        {#snippet controls()}
            <FormField label="Server" class="w-64">
                <Select items={behaviorItems} bind:value={behavior} />
            </FormField>
            <FormField label="On conflict" class="w-56">
                <Select items={resolutionItems} bind:value={resolution} />
            </FormField>
            <FormField label="Delay: {latency} ms" class="w-56">
                <Slider bind:value={latency} min={0} max={3000} step={100} />
            </FormField>
        {/snippet}
        {#snippet aside()}
            <LogPanel {log} title="Server log" />
        {/snippet}
        <Scheduler
            creatable={false}
            bind:events
            {timeZone}
            {calendars}
            {onMutate}
            {onConflict}
            {onError}
            class="h-full"
        />
    </DemoCard>
</div>

<script lang="ts">
    import { Avatar, Badge, Empty, Icon } from 'sv5ui'
    import {
        Scheduler,
        type CellSnippetProps,
        type EventDetailSnippetProps,
        type EventInput,
        type EventSnippetProps,
        type HeaderSnippetProps
    } from '$lib/index.js'
    import DemoCard from '../../../demo/DemoCard.svelte'
    import PageHeader from '../../../demo/PageHeader.svelte'
    import { holidays, timeAt, timeZone } from '../../../demo/data.js'

    interface Meeting {
        location: string
        attendees: string[]
        icon: string
    }

    const meetings = (): EventInput<Meeting>[] => [
        {
            id: 'kickoff',
            title: 'Project kickoff',
            start: timeAt(0, '09:30'),
            end: timeAt(0, '11:00'),
            color: 'primary',
            data: {
                location: 'Room Aurora',
                attendees: ['Linh', 'Minh', 'Sara'],
                icon: 'lucide:rocket'
            }
        },
        {
            id: 'interview',
            title: 'Candidate interview',
            start: timeAt(1, '14:00'),
            end: timeAt(1, '15:00'),
            color: 'tertiary',
            data: { location: 'Video call', attendees: ['Tom', 'Linh'], icon: 'lucide:video' }
        },
        {
            id: 'lunch',
            title: 'Lunch with design',
            start: timeAt(2, '12:00'),
            end: timeAt(2, '13:00'),
            color: 'success',
            data: {
                location: 'Pho 24',
                attendees: ['Mai', 'An', 'Sara', 'Kenji'],
                icon: 'lucide:utensils'
            }
        },
        {
            id: 'launch',
            title: 'Launch review',
            start: timeAt(3, '16:00'),
            end: timeAt(3, '17:30'),
            color: 'warning',
            data: { location: 'Boardroom', attendees: ['Minh', 'Tom'], icon: 'lucide:flag' }
        },
        {
            id: 'support',
            title: 'Customer support rota',
            start: timeAt(4, '08:00'),
            end: timeAt(4, '12:00'),
            color: 'info',
            data: { location: 'Help desk', attendees: ['An'], icon: 'lucide:headset' }
        }
    ]

    let events = $state<EventInput<Meeting>[]>(meetings())
    let detailEvents = $state<EventInput<Meeting>[]>(meetings())
    let emptyEvents = $state<EventInput<Meeting>[]>([])

    const initials = (name: string) => name.slice(0, 2).toUpperCase()

    const code = `<Scheduler bind:events event={card} cell={weekend} header={dayHeader} />

{#snippet card({ event, isSelected })}
    <div class="h-full rounded-lg bg-primary-container p-2">
        <Icon name={event.data.icon} /> {event.title}
        <p>{event.data.location}</p>
    </div>
{/snippet}

{#snippet weekend({ isWeekend })}
    {#if isWeekend}<div class="absolute inset-0 bg-stripes"></div>{/if}
{/snippet}`
</script>

{#snippet card({ event, isSelected, isDragging }: EventSnippetProps<Meeting>)}
    <div
        class={[
            'flex h-full flex-col gap-1 overflow-hidden rounded-lg border-s-4 border-primary bg-primary-container/80 p-2 text-on-primary-container shadow-sm',
            isSelected && 'ring-2 ring-primary',
            isDragging && 'opacity-60'
        ]}
    >
        <div class="flex items-center gap-1.5 text-xs font-semibold">
            <Icon name={event.data?.icon ?? 'lucide:calendar'} size="14" />
            <span class="truncate">{event.title}</span>
        </div>
        {#if event.data}
            <p class="flex items-center gap-1 truncate text-[11px] opacity-80">
                <Icon name="lucide:map-pin" size="12" />
                {event.data.location}
            </p>
            <div class="mt-auto flex -space-x-1.5">
                {#each event.data.attendees as person (person)}
                    <span
                        class="flex size-6 items-center justify-center rounded-full bg-surface text-[10px] font-semibold text-on-surface ring-2 ring-surface-container-lowest"
                    >
                        {initials(person)}
                    </span>
                {/each}
            </div>
        {/if}
    </div>
{/snippet}

{#snippet weekend({ isWeekend }: CellSnippetProps)}
    {#if isWeekend}
        <div
            class="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(135deg,transparent_0_8px,color-mix(in_oklab,var(--color-outline-variant)_70%,transparent)_8px_9px)]"
        ></div>
    {/if}
{/snippet}

{#snippet dayHeader({ label, isToday, holiday }: HeaderSnippetProps)}
    <div class="flex flex-col items-center gap-1 py-0.5">
        <span class="text-xs font-semibold text-on-surface">{label}</span>
        {#if isToday}
            <Badge label="Today" color="primary" variant="solid" size="xs" />
        {:else if holiday}
            <Badge label={holiday.title ?? 'Holiday'} color="tertiary" variant="soft" size="xs" />
        {/if}
    </div>
{/snippet}

{#snippet detail({ event }: EventDetailSnippetProps<Meeting>)}
    {#if event.data}
        <div class="space-y-3 border-t border-outline-variant/60 pt-3">
            <p class="flex items-center gap-2 text-sm text-on-surface">
                <Icon name="lucide:map-pin" size="16" class="text-on-surface-variant" />
                {event.data.location}
            </p>
            <div class="flex items-center gap-2">
                {#each event.data.attendees as person (person)}
                    <Avatar text={initials(person)} alt={person} size="sm" />
                {/each}
            </div>
        </div>
    {/if}
{/snippet}

{#snippet nothing()}
    <Empty
        icon="lucide:coffee"
        title="A quiet week"
        description="Nothing is planned for this week."
    />
{/snippet}

<div class="mx-auto max-w-[1600px] space-y-10 px-4 py-8 sm:px-6 lg:px-8">
    <PageHeader
        icon="lucide:brush"
        badge="Customization"
        title="Custom rendering"
        description="Replace any part of the default look with a snippet. Your data travels on event.data with its own type, and the scheduler hands it back to every snippet untouched."
    />

    <DemoCard
        title="Events, cells and headers"
        description="The event snippet draws a card with an icon, a location and attendees. The cell snippet stripes weekends, and the header snippet adds a badge for today and holidays."
        {code}
        height="h-[720px]"
    >
        <Scheduler
            creatable={false}
            bind:events
            {timeZone}
            {holidays}
            slotHeight={36}
            event={card}
            cell={weekend}
            header={dayHeader}
            class="h-full"
        />
    </DemoCard>

    <div class="grid gap-10 xl:grid-cols-2">
        <DemoCard
            title="Details in the popover"
            description="Keep the default chips and add your own content under the details. Click an event."
            height="h-[560px]"
        >
            <Scheduler
                creatable={false}
                bind:events={detailEvents}
                {timeZone}
                view="agenda"
                eventDetail={detail}
                class="h-full"
            />
        </DemoCard>

        <DemoCard
            title="Empty state"
            description="The empty snippet replaces the message shown when the range holds nothing."
            height="h-[560px]"
        >
            <Scheduler
                creatable={false}
                bind:events={emptyEvents}
                {timeZone}
                empty={nothing}
                class="h-full"
            />
        </DemoCard>
    </div>
</div>

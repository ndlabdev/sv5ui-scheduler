<script lang="ts">
    import { Badge, Card, Icon } from 'sv5ui'
    import { Scheduler, type EventInput } from '$lib/index.js'
    import DemoCard from '../../../demo/DemoCard.svelte'
    import PageHeader from '../../../demo/PageHeader.svelte'
    import { calendars, dayAt, timeAt, timeZone } from '../../../demo/data.js'

    let events = $state<EventInput[]>([
        {
            id: 'standup',
            title: 'Daily standup',
            calendarId: 'team',
            start: timeAt(-28, '09:00'),
            end: timeAt(-28, '09:15'),
            recurrence: { freq: 'weekly', byDay: [1, 2, 3, 4, 5] }
        },
        {
            id: 'demo',
            title: 'Sprint demo',
            calendarId: 'work',
            start: timeAt(-24, '15:00'),
            end: timeAt(-24, '16:00'),
            recurrence: { freq: 'weekly', interval: 2, byDay: [5] }
        },
        {
            id: 'budget',
            title: 'Budget review',
            calendarId: 'work',
            start: timeAt(-30, '14:00'),
            end: timeAt(-30, '15:00'),
            recurrence: { freq: 'monthly' }
        },
        {
            id: 'yoga',
            title: 'Yoga class',
            calendarId: 'personal',
            start: timeAt(1, '07:00'),
            end: timeAt(1, '08:00'),
            recurrence: { freq: 'weekly', byDay: [2, 4], count: 6 }
        },
        {
            id: 'mentoring',
            title: 'Mentoring',
            calendarId: 'learning',
            start: timeAt(-7, '17:00'),
            end: timeAt(-7, '17:45'),
            recurrence: { freq: 'weekly', byDay: [3], until: dayAt(21) }
        },
        {
            id: 'lunch',
            title: 'Team lunch',
            calendarId: 'team',
            start: timeAt(-4, '12:00'),
            end: timeAt(-4, '13:00'),
            recurrence: { freq: 'weekly', byDay: [4], exDates: [timeAt(10, '12:00')] }
        },
        {
            id: 'anniversary',
            title: 'Company anniversary',
            calendarId: 'birthdays',
            start: dayAt(-360),
            end: dayAt(-359),
            allDay: true,
            recurrence: { freq: 'yearly' }
        }
    ])

    let view = $state('month')

    const rules = [
        {
            title: 'Daily standup',
            rule: "{ freq: 'weekly', byDay: [1, 2, 3, 4, 5] }",
            description: 'Every weekday at nine.',
            color: 'info'
        },
        {
            title: 'Sprint demo',
            rule: "{ freq: 'weekly', interval: 2, byDay: [5] }",
            description: 'Every other Friday.',
            color: 'primary'
        },
        {
            title: 'Budget review',
            rule: "{ freq: 'monthly' }",
            description: 'On the same day every month.',
            color: 'primary'
        },
        {
            title: 'Yoga class',
            rule: "{ freq: 'weekly', byDay: [2, 4], count: 6 }",
            description: 'Tuesdays and Thursdays, six classes in total.',
            color: 'success'
        },
        {
            title: 'Mentoring',
            rule: "{ freq: 'weekly', byDay: [3], until: '...' }",
            description: 'Wednesdays until three weeks from now.',
            color: 'tertiary'
        },
        {
            title: 'Team lunch',
            rule: "{ freq: 'weekly', byDay: [4], exDates: ['...'] }",
            description: 'Thursdays, except next week.',
            color: 'info'
        },
        {
            title: 'Company anniversary',
            rule: "{ freq: 'yearly' }",
            description: 'Once a year, all day.',
            color: 'secondary'
        }
    ] as const

    const code = `const events = [
    {
        id: 'yoga',
        title: 'Yoga class',
        start: '2026-09-15T07:00',
        end: '2026-09-15T08:00',
        recurrence: { freq: 'weekly', byDay: [2, 4], count: 6 }
    },
    {
        id: 'lunch',
        title: 'Team lunch',
        start: '2026-09-10T12:00',
        end: '2026-09-10T13:00',
        recurrence: { freq: 'weekly', byDay: [4], exDates: ['2026-09-24T12:00'] }
    }
]`
</script>

<div class="mx-auto max-w-[1600px] space-y-10 px-4 py-8 sm:px-6 lg:px-8">
    <PageHeader
        icon="lucide:repeat"
        badge="Views"
        title="Recurrence"
        description="Give an event a recurrence rule and it repeats across every view. Series are expanded only for the visible range, so a rule with no end costs nothing."
    />

    <DemoCard
        title="Repeating events"
        description="Switch between month, week and agenda to follow each series. Occurrences are read only; edit the series to change them all."
        {code}
        height="h-[760px]"
    >
        {#snippet aside()}
            <Card variant="soft" class="h-full">
                <div class="space-y-4">
                    <div class="flex items-center gap-2 text-sm font-semibold text-on-surface">
                        <Icon name="lucide:list-checks" size="16" />
                        Rules in this calendar
                    </div>
                    <ul class="space-y-3">
                        {#each rules as rule (rule.title)}
                            <li class="space-y-1">
                                <div class="flex items-center gap-2">
                                    <Badge
                                        label={rule.title}
                                        color={rule.color}
                                        variant="soft"
                                        size="sm"
                                    />
                                </div>
                                <p class="text-sm text-on-surface">{rule.description}</p>
                                <code
                                    class="block font-mono text-[11px] break-all text-on-surface-variant"
                                >
                                    {rule.rule}
                                </code>
                            </li>
                        {/each}
                    </ul>
                </div>
            </Card>
        {/snippet}
        <Scheduler creatable={false} bind:events bind:view {timeZone} {calendars} class="h-full" />
    </DemoCard>
</div>

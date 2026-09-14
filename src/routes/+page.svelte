<script lang="ts">
    import { Badge, Button, Card, Icon } from 'sv5ui'
    import { Scheduler, type EventInput } from '$lib/index.js'
    import CodeBlock from '../demo/CodeBlock.svelte'
    import { calendars, teamEvents, timeZone } from '../demo/data.js'
    import { allDemos, demoGroups } from '../demo/nav.js'

    let events = $state<EventInput[]>(teamEvents())

    const playground = allDemos.find((demo) => demo.title === 'Playground')
    const groups = demoGroups
        .map((group) => ({
            ...group,
            demos: group.demos.filter((demo) => demo.title !== 'Overview')
        }))
        .filter((group) => group.demos.length > 0)

    const highlights = [
        {
            icon: 'lucide:calendar-range',
            title: 'Five views',
            description: 'Month, week, day, year and agenda, plus any number of days in a row.'
        },
        {
            icon: 'lucide:mouse-pointer-click',
            title: 'Direct manipulation',
            description: 'Create, move and resize with a mouse, a finger or the keyboard.'
        },
        {
            icon: 'lucide:refresh-ccw',
            title: 'Optimistic by default',
            description:
                'Changes show instantly and roll back with an animation when the server says no.'
        },
        {
            icon: 'lucide:globe',
            title: 'Correct everywhere',
            description:
                'Thirteen locales, right to left layouts and daylight saving that never loses an hour.'
        }
    ]

    const install = 'pnpm add @sv5ui/scheduler sv5ui @internationalized/date'

    const usage = `<Scheduler
    bind:events
    view="week"
    timeZone="Asia/Ho_Chi_Minh"
    businessHours={{ start: '09:00', end: '18:00', days: [1, 2, 3, 4, 5] }}
    sidebar
/>`
</script>

<svelte:head>
    <title>Scheduler for Svelte 5</title>
</svelte:head>

<div class="mx-auto max-w-7xl space-y-16 px-4 py-10 sm:px-6 lg:px-8">
    <section class="grid items-center gap-10 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div class="space-y-6">
            <Badge
                label="Built on sv5ui"
                color="primary"
                variant="soft"
                leadingIcon="lucide:sparkles"
            />
            <h1
                class="text-4xl font-semibold tracking-tight text-balance text-on-surface sm:text-5xl"
            >
                Scheduling that feels native to your Svelte app
            </h1>
            <p class="text-lg leading-relaxed text-pretty text-on-surface-variant">
                A calendar and scheduler component for Svelte 5. Drop it in, bind an array of
                events, and get drag and drop, keyboard access, time zones and an optimistic update
                pipeline without writing any of it yourself.
            </p>
            <div class="flex flex-wrap gap-3">
                <Button
                    href={playground?.href}
                    label="Open the playground"
                    trailingIcon="lucide:arrow-right"
                />
                <Button href="#demos" label="Browse the demos" variant="outline" color="surface" />
            </div>
        </div>
        <Card variant="outline">
            <div class="h-[480px]">
                <Scheduler bind:events {timeZone} {calendars} view="month" class="h-full" />
            </div>
        </Card>
    </section>

    <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {#each highlights as highlight (highlight.title)}
            <Card variant="soft">
                <div class="space-y-3">
                    <span
                        class="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"
                    >
                        <Icon name={highlight.icon} size="20" />
                    </span>
                    <h2 class="font-semibold text-on-surface">{highlight.title}</h2>
                    <p class="text-sm leading-relaxed text-on-surface-variant">
                        {highlight.description}
                    </p>
                </div>
            </Card>
        {/each}
    </section>

    <section id="demos" class="scroll-mt-20 space-y-10">
        <div class="space-y-2">
            <h2 class="text-2xl font-semibold tracking-tight text-on-surface">Demos</h2>
            <p class="text-on-surface-variant">
                Each page focuses on one part of the library and shows the code that drives it.
            </p>
        </div>
        {#each groups as group (group.title)}
            <div class="space-y-4">
                <h3 class="text-xs font-semibold tracking-wider text-on-surface-variant uppercase">
                    {group.title}
                </h3>
                <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {#each group.demos as demo (demo.href)}
                        <Card variant="outline" class="transition-colors hover:border-primary/40">
                            <div class="flex h-full flex-col gap-3">
                                <div class="flex items-center gap-3">
                                    <span
                                        class="flex size-9 items-center justify-center rounded-lg bg-surface-container-high text-on-surface"
                                    >
                                        <Icon name={demo.icon} size="18" />
                                    </span>
                                    <span class="font-semibold text-on-surface">{demo.title}</span>
                                </div>
                                <p class="flex-1 text-sm leading-relaxed text-on-surface-variant">
                                    {demo.description}
                                </p>
                                <div>
                                    <Button
                                        href={demo.href}
                                        label="Open demo"
                                        variant="link"
                                        trailingIcon="lucide:arrow-right"
                                        class="px-0"
                                    />
                                </div>
                            </div>
                        </Card>
                    {/each}
                </div>
            </div>
        {/each}
    </section>

    <section class="grid gap-6 lg:grid-cols-2">
        <div class="space-y-3">
            <h2 class="text-2xl font-semibold tracking-tight text-on-surface">Install</h2>
            <p class="text-on-surface-variant">
                sv5ui provides the design tokens and building blocks the scheduler is made of.
            </p>
            <CodeBlock code={install} filename="Terminal" />
        </div>
        <div class="space-y-3">
            <h2 class="text-2xl font-semibold tracking-tight text-on-surface">Use</h2>
            <p class="text-on-surface-variant">
                Bind an array of events. Everything the user changes is written back into it.
            </p>
            <CodeBlock code={usage} />
        </div>
    </section>
</div>

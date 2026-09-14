<script lang="ts">
    import { page } from '$app/state'
    import { ModeWatcher } from 'mode-watcher'
    import {
        Breadcrumb,
        Button,
        Main,
        Sidebar,
        SidebarTrigger,
        ThemeModeButton,
        Toaster,
        type BreadcrumbItem,
        type NavigationMenuItem,
        type SidebarApi
    } from 'sv5ui'
    import { allDemos, demoGroups, findDemo } from '../demo/nav.js'
    import './layout.css'

    let { children } = $props()

    let api = $state<SidebarApi>()

    const home = allDemos[0]

    const items = $derived(
        demoGroups.map((group): NavigationMenuItem[] => [
            { label: group.title, type: 'label' },
            ...group.demos.map((demo) => ({
                label: demo.title,
                icon: demo.icon,
                href: demo.href,
                active: page.url.pathname === demo.href
            }))
        ])
    )

    const crumbs = $derived.by((): BreadcrumbItem[] => {
        const current = findDemo(page.url.pathname)
        const root = { label: 'Scheduler', href: home.href, icon: 'lucide:calendar-days' }
        if (!current || current.href === home.href) return [root]
        return [root, { label: current.group }, { label: current.title }]
    })
</script>

<ModeWatcher />
<Toaster />

<div class="flex h-dvh overflow-hidden bg-surface text-on-surface">
    <Sidebar
        bind:api
        title="Scheduler"
        description="for Svelte 5"
        {items}
        rail
        breakpoint="lg"
        width={272}
    />
    <div class="flex min-w-0 flex-1 flex-col">
        <header
            class="flex h-16 shrink-0 items-center gap-3 border-b border-outline-variant/60 bg-surface/80 px-4 backdrop-blur"
        >
            <SidebarTrigger {api} variant="ghost" color="surface" size="sm" />
            <Breadcrumb items={crumbs} class="hidden min-w-0 sm:flex" />
            <div class="ms-auto flex items-center gap-1">
                <Button
                    href="https://github.com/ndlabdev/sv5ui-scheduler"
                    variant="ghost"
                    color="surface"
                    size="sm"
                    square
                    icon="simple-icons:github"
                    aria-label="Source on GitHub"
                />
                <ThemeModeButton />
            </div>
        </header>
        <Main class="min-h-0 flex-1 overflow-y-auto">
            {@render children()}
        </Main>
    </div>
</div>

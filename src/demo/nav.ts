import { resolve } from '$app/paths'

export interface Demo {
    title: string
    description: string
    icon: string
    href: string
}

export interface DemoGroup {
    title: string
    demos: Demo[]
}

export const demoGroups: DemoGroup[] = [
    {
        title: 'Get started',
        demos: [
            {
                title: 'Overview',
                description: 'What the scheduler does and where each demo lives.',
                icon: 'lucide:house',
                href: resolve('/')
            },
            {
                title: 'Playground',
                description: 'A complete calendar app with a sidebar, calendars and drag sources.',
                icon: 'lucide:layout-dashboard',
                href: resolve('/demos/playground')
            }
        ]
    },
    {
        title: 'Views',
        demos: [
            {
                title: 'Views and ranges',
                description: 'Month, week, day, year and agenda, custom durations and slot sizes.',
                icon: 'lucide:calendar-range',
                href: resolve('/demos/views')
            },
            {
                title: 'Business hours',
                description: 'Working hours, holidays, background events and week numbers.',
                icon: 'lucide:briefcase-business',
                href: resolve('/demos/business-hours')
            },
            {
                title: 'Recurrence',
                description:
                    'Daily, weekly, monthly and yearly series with counts, end dates and exceptions.',
                icon: 'lucide:repeat',
                href: resolve('/demos/recurrence')
            }
        ]
    },
    {
        title: 'Interaction',
        demos: [
            {
                title: 'Drag and drop',
                description: 'Move and resize events, and drop items from your own lists.',
                icon: 'lucide:move',
                href: resolve('/demos/drag-and-drop')
            },
            {
                title: 'Keyboard',
                description: 'Every gesture from the keyboard, with screen reader announcements.',
                icon: 'lucide:keyboard',
                href: resolve('/demos/keyboard')
            }
        ]
    },
    {
        title: 'Data',
        demos: [
            {
                title: 'Mutations',
                description:
                    'Optimistic updates against a simulated server that fails and conflicts.',
                icon: 'lucide:server',
                href: resolve('/demos/mutations')
            },
            {
                title: 'Async source',
                description:
                    'Load only the visible range from a slow API, with caching and errors.',
                icon: 'lucide:cloud-download',
                href: resolve('/demos/async-source')
            }
        ]
    },
    {
        title: 'Localization',
        demos: [
            {
                title: 'Languages and RTL',
                description:
                    'Thirteen locale packs, right to left layouts, clocks and week starts.',
                icon: 'lucide:languages',
                href: resolve('/demos/i18n')
            },
            {
                title: 'Time zones',
                description:
                    'The same instants in different zones, across daylight saving changes.',
                icon: 'lucide:globe',
                href: resolve('/demos/time-zones')
            }
        ]
    },
    {
        title: 'Customization',
        demos: [
            {
                title: 'Custom rendering',
                description: 'Snippets for events, cells, headers, details and empty states.',
                icon: 'lucide:brush',
                href: resolve('/demos/custom-rendering')
            },
            {
                title: 'Theming',
                description: 'Event colours, per slot class overrides and dark mode.',
                icon: 'lucide:palette',
                href: resolve('/demos/theming')
            },
            {
                title: 'Extensions',
                description: 'Register your own views, interactions and store middleware.',
                icon: 'lucide:puzzle',
                href: resolve('/demos/extensions')
            }
        ]
    },
    {
        title: 'Components',
        demos: [
            {
                title: 'Sidebar',
                description: 'The built-in sidebar, its slots, and a sidebar of your own.',
                icon: 'lucide:panel-left',
                href: resolve('/demos/sidebar')
            },
            {
                title: 'Building blocks',
                description:
                    'DateNavigator, CalendarList, SearchBox, DragSourceList and EventChip on their own.',
                icon: 'lucide:blocks',
                href: resolve('/demos/components')
            }
        ]
    }
]

export const allDemos = demoGroups.flatMap((group) =>
    group.demos.map((demo) => ({ ...demo, group: group.title }))
)

export function findDemo(pathname: string) {
    return allDemos.find((demo) => demo.href === pathname)
}

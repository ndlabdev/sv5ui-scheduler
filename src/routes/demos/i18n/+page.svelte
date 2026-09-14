<script lang="ts">
    import { FormField, Select } from 'sv5ui'
    import { Scheduler, type EventInput, type SchedulerLabels, type WeekDay } from '$lib/index.js'
    import * as packs from '$lib/locales/index.js'
    import DemoCard from '../../../demo/DemoCard.svelte'
    import PageHeader from '../../../demo/PageHeader.svelte'
    import { calendars, teamEvents, timeZone } from '../../../demo/data.js'

    const labelPacks: Record<string, SchedulerLabels> = packs

    const languages = [
        { value: 'en', label: 'English', locale: 'en-US' },
        { value: 'vi', label: 'Tiếng Việt', locale: 'vi-VN' },
        { value: 'ar', label: 'العربية', locale: 'ar-EG' },
        { value: 'de', label: 'Deutsch', locale: 'de-DE' },
        { value: 'es', label: 'Español', locale: 'es-ES' },
        { value: 'fr', label: 'Français', locale: 'fr-FR' },
        { value: 'it', label: 'Italiano', locale: 'it-IT' },
        { value: 'ja', label: '日本語', locale: 'ja-JP' },
        { value: 'ko', label: '한국어', locale: 'ko-KR' },
        { value: 'nl', label: 'Nederlands', locale: 'nl-NL' },
        { value: 'pt', label: 'Português', locale: 'pt-BR' },
        { value: 'ru', label: 'Русский', locale: 'ru-RU' },
        { value: 'zh', label: '中文', locale: 'zh-CN' }
    ]

    let events = $state<EventInput[]>(teamEvents())
    let sideEvents = $state<EventInput[]>(teamEvents())
    let language = $state('vi')
    let clock = $state('locale')
    let weekStartsOn = $state('1')
    let direction = $state('auto')
    let view = $state('week')

    const clockItems = [
        { label: 'Follow the locale', value: 'locale' },
        { label: '12 hour', value: '12' },
        { label: '24 hour', value: '24' }
    ]
    const startItems = [
        { label: 'Monday', value: '1' },
        { label: 'Sunday', value: '0' },
        { label: 'Saturday', value: '6' }
    ]
    const directionItems = [
        { label: 'From the language', value: 'auto' },
        { label: 'Left to right', value: 'ltr' },
        { label: 'Right to left', value: 'rtl' }
    ]

    const current = $derived(languages.find((item) => item.value === language) ?? languages[0])
    const dir = $derived(
        direction === 'auto' ? (language === 'ar' ? 'rtl' : 'ltr') : (direction as 'ltr' | 'rtl')
    )
    const hour12 = $derived(clock === 'locale' ? undefined : clock === '12')

    const code = $derived(`import { ${language} } from '@sv5ui/scheduler/locales'

<Scheduler
    bind:events
    locale="${current.locale}"
    labels={${language}}
    dir="${dir}"${hour12 === undefined ? '' : `\n    hour12={${hour12}}`}
    weekStartsOn={${weekStartsOn}}
/>`)
</script>

<div class="mx-auto max-w-[1600px] space-y-10 px-4 py-8 sm:px-6 lg:px-8">
    <PageHeader
        icon="lucide:languages"
        badge="Localization"
        title="Languages and RTL"
        description="Dates, times and numbers follow the locale through Intl. Interface text comes from a label pack, so you ship only the languages you use, and right to left layouts mirror the whole scheduler including drag gestures."
    />

    <DemoCard
        title="Pick a language"
        description="Thirteen packs ship with the library. Missing keys in your own pack fall back to English."
        {code}
        height="h-[720px]"
    >
        {#snippet controls()}
            <FormField label="Language" class="w-48">
                <Select items={languages} bind:value={language} />
            </FormField>
            <FormField label="Clock" class="w-44">
                <Select items={clockItems} bind:value={clock} />
            </FormField>
            <FormField label="Week starts on" class="w-40">
                <Select items={startItems} bind:value={weekStartsOn} />
            </FormField>
            <FormField label="Direction" class="w-48">
                <Select items={directionItems} bind:value={direction} />
            </FormField>
        {/snippet}
        <Scheduler
            creatable={false}
            bind:events
            bind:view
            {timeZone}
            {calendars}
            locale={current.locale}
            labels={labelPacks[language]}
            {dir}
            {hour12}
            weekStartsOn={Number(weekStartsOn) as WeekDay}
            sidebar
            class="h-full"
        />
    </DemoCard>

    <DemoCard
        title="Side by side"
        description="Two schedulers on one page keep their own language, direction and state."
        height="h-[560px]"
    >
        <div class="grid h-full gap-4 lg:grid-cols-2">
            <Scheduler
                creatable={false}
                bind:events={sideEvents}
                view="month"
                {timeZone}
                {calendars}
                locale="ja-JP"
                labels={packs.ja}
                class="h-full rounded-xl border border-outline-variant/60"
            />
            <Scheduler
                creatable={false}
                bind:events={sideEvents}
                view="month"
                {timeZone}
                {calendars}
                locale="ar-EG"
                labels={packs.ar}
                dir="rtl"
                class="h-full rounded-xl border border-outline-variant/60"
            />
        </div>
    </DemoCard>
</div>

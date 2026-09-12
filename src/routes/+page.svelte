<script lang="ts">
	import { Button, Card, ThemeModeButton } from 'sv5ui'
</script>

<main class="bg-surface text-on-surface min-h-screen p-8">
	<Card>
		<div class="flex items-center gap-3">
			<Button color="primary" leadingIcon="lucide:calendar">Scheduler</Button>
			<Button variant="outline">Today</Button>
			<ThemeModeButton />
		</div>
	</Card>
</main>

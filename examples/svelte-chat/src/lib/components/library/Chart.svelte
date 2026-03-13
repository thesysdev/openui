<script lang="ts">
	import type { ComponentRenderProps } from "@openuidev/svelte-lang";
	import * as Card from "$lib/components/ui/card/index.js";

	interface Props
		extends ComponentRenderProps<{
			type: "bar" | "line" | "pie";
			title: string;
			data: Array<{ label: string; value: number }>;
		}> {}

	let { props }: Props = $props();

	const maxValue = $derived(Math.max(...props.data.map((d) => d.value)));
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>{props.title}</Card.Title>
		<Card.Description class="text-xs text-muted-foreground">{props.type} chart</Card.Description>
	</Card.Header>
	<Card.Content>
		<div class="space-y-3">
			{#each props.data as item}
				<div class="space-y-1">
					<div class="flex items-center justify-between text-sm">
						<span class="text-muted-foreground">{item.label}</span>
						<span class="font-medium text-foreground">{item.value}</span>
					</div>
					<div class="h-2 w-full overflow-hidden rounded-full bg-muted">
						<div
							class="h-full rounded-full bg-primary transition-all duration-300"
							style="width: {(item.value / maxValue) * 100}%"
						></div>
					</div>
				</div>
			{/each}
		</div>
	</Card.Content>
</Card.Root>

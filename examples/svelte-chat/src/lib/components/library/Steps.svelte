<script lang="ts">
	import type { ComponentRenderProps } from "@openuidev/svelte-lang";

	// Parser returns items as ElementNode objects: { type: "element", props: { title, details } }
	interface StepsItemNode {
		props: {
			title: string;
			details: string;
		};
	}

	interface Props
		extends ComponentRenderProps<{
			items: StepsItemNode[];
		}> {}

	let { props }: Props = $props();
</script>

<div class="flex flex-col">
	{#each props.items ?? [] as item, i}
		<div class="flex gap-4">
			<div class="flex shrink-0 flex-col items-center">
				<span
					class="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
				>
					{i + 1}
				</span>
				{#if i < (props.items?.length ?? 0) - 1}
					<div class="min-h-4 w-0.5 flex-1 bg-border"></div>
				{/if}
			</div>
			<div class="pb-6">
				<strong class="block text-foreground">{item.props.title}</strong>
				<p class="m-0 text-sm leading-relaxed text-muted-foreground">{item.props.details}</p>
			</div>
		</div>
	{/each}
</div>

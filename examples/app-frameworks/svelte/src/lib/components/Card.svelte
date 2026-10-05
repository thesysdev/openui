<script lang="ts">
	import type { Snippet } from "svelte";

	let {
		props,
		renderNode,
	}: { props: { title?: string; children?: unknown }; renderNode: Snippet<[unknown]> } = $props();
</script>

<div class="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm">
	{#if props.title}
		<h3 class="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2">{props.title}</h3>
	{/if}
	{#if props.children}
		<div class="space-y-2">
			{@render renderNode(props.children)}
		</div>
	{/if}
</div>

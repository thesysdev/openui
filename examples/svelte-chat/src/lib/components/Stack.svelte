<script lang="ts">
	import type { Snippet } from "svelte";

	let {
		props,
		renderNode,
	}: { props: { children?: unknown }; renderNode: Snippet<[unknown]> } = $props();
</script>

<div class="stack">
	{#if props.children}
		{@render renderNode(props.children)}
	{/if}
</div>

<style>
	.stack {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
</style>

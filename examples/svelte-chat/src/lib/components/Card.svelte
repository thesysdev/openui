<script lang="ts">
	import type { Snippet } from "svelte";

	let {
		props,
		renderNode,
	}: { props: { title?: string; children?: unknown }; renderNode: Snippet<[unknown]> } = $props();
</script>

<div class="card">
	{#if props.title}
		<h3 class="card-title">{props.title}</h3>
	{/if}
	{#if props.children}
		{@render renderNode(props.children)}
	{/if}
</div>

<style>
	.card {
		background: white;
		border-radius: 8px;
		padding: 16px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.card-title {
		font-size: 1.1rem;
		font-weight: 600;
		margin-bottom: 8px;
	}
</style>

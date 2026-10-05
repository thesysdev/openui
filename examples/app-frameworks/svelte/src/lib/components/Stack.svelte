<script lang="ts">
	import type { Snippet } from "svelte";

	let {
		props,
		renderNode,
	}: { props: { children?: unknown }; renderNode: Snippet<[unknown]> } = $props();
</script>

<div class="flex flex-col gap-4">
	{#if props.children}
		{@render renderNode(props.children)}
	{/if}
</div>

<script lang="ts">
	import type { Snippet } from "svelte";

	let { props }: { props: { text?: string }; renderNode: Snippet<[unknown]> } = $props();
</script>

<p class="text-content">{props.text ?? ""}</p>

<style>
	.text-content {
		line-height: 1.5;
		color: #333;
	}
</style>

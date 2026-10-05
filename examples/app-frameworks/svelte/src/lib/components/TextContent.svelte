<script lang="ts">
	import type { Snippet } from "svelte";

	let { props }: { props: { text?: string }; renderNode: Snippet<[unknown]> } = $props();
</script>

<p class="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">{props.text ?? ""}</p>

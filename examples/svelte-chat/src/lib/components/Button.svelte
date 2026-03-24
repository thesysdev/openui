<script lang="ts">
	import type { Snippet } from "svelte";
	import { getTriggerAction } from "@openuidev/svelte-lang";

	let { props }: { props: { label?: string; action?: string }; renderNode: Snippet<[unknown]> } =
		$props();

	const triggerAction = getTriggerAction();
</script>

<button
	class="inline-flex items-center rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
	onclick={() =>
		triggerAction(
			props.label ?? "Click",
			undefined,
			props.action ? { type: props.action } : undefined,
		)}
>
	{props.label ?? "Button"}
</button>

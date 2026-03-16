<script lang="ts">
	import type { Snippet } from "svelte";
	import { getTriggerAction } from "@openuidev/svelte-lang";

	let { props }: { props: { label?: string; action?: string }; renderNode: Snippet<[unknown]> } =
		$props();

	const triggerAction = getTriggerAction();
</script>

<button
	class="btn"
	onclick={() =>
		triggerAction(props.label ?? "Click", undefined, props.action ? { type: props.action } : undefined)}
>
	{props.label ?? "Button"}
</button>

<style>
	.btn {
		padding: 8px 16px;
		background: #2563eb;
		color: white;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.9rem;
	}

	.btn:hover {
		background: #1d4ed8;
	}
</style>

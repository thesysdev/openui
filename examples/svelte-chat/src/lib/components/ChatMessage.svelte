<script lang="ts">
	import { Renderer } from "@openuidev/svelte-lang";
	import type { Library, ActionEvent } from "@openuidev/svelte-lang";

	interface Props {
		role: "user" | "assistant";
		content: string;
		library?: Library;
		isStreaming?: boolean;
		onAction?: (event: ActionEvent) => void;
	}

	let { role, content, library, isStreaming = false, onAction }: Props = $props();
</script>

<div
	class="mb-4 rounded-lg p-4 {role === 'user'
		? 'ml-8 bg-primary/10'
		: 'mr-8 border bg-card shadow-sm'}"
>
	<div class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
		{role === "user" ? "You" : "Assistant"}
	</div>
	<div class="leading-relaxed text-foreground">
		{#if role === "assistant" && library}
			<Renderer response={content} {library} {isStreaming} {onAction} />
		{:else}
			<p class="m-0">{content}</p>
		{/if}
	</div>
</div>

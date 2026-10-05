<script lang="ts">
	import { Renderer, type ActionEvent } from "@openuidev/svelte-lang";
	import type { Library } from "@openuidev/svelte-lang";

	interface Props {
		parts: any[];
		library: Library;
		isStreaming: boolean;
		onAction: (event: ActionEvent) => void;
	}

	let { parts, library, isStreaming, onAction }: Props = $props();

	function getTextContent(parts: any[]): string {
		return parts
			.filter((p: any) => p.type === "text")
			.map((p: any) => p.text)
			.join("");
	}

	function isToolPart(part: any): boolean {
		return part.type?.startsWith("tool-") || part.type === "dynamic-tool";
	}

	function getToolName(part: any): string {
		if (part.type === "dynamic-tool" && "toolName" in part) return part.toolName;
		return part.type?.replace(/^tool-/, "") ?? "";
	}

	const textContent = $derived(getTextContent(parts));
	const toolParts = $derived(parts.filter(isToolPart));
</script>

<div class="flex gap-3">
	<div
		class="shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center"
	>
		<span class="text-[10px] font-bold text-white">AI</span>
	</div>
	<div class="flex-1 min-w-0 space-y-2">
		{#each toolParts as tp}
			{@const state = (tp as any).state}
			{@const done = state === "output-available"}
			<div class="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
				{#if done}
					<svg
						class="w-3.5 h-3.5 text-green-500"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2.5"
							d="M5 13l4 4L19 7"
						/>
					</svg>
				{:else}
					<div
						class="w-3.5 h-3.5 border-2 border-zinc-300 dark:border-zinc-600 border-t-transparent rounded-full animate-spin"
					></div>
				{/if}
				<span class="font-medium">{getToolName(tp)}</span>
			</div>
		{/each}
		{#if textContent}
			<Renderer response={textContent} {library} {isStreaming} {onAction} />
		{/if}
	</div>
</div>

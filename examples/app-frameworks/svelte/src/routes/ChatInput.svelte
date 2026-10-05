<script lang="ts">
	interface Props {
		isLoading: boolean;
		onSubmit: (text: string) => void;
		onStop: () => void;
	}

	let { isLoading, onSubmit, onStop }: Props = $props();
	let input = $state("");

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		const text = input.trim();
		if (!text || isLoading) return;
		input = "";
		onSubmit(text);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSubmit(new SubmitEvent("submit"));
		}
	}
</script>

<div class="shrink-0 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
	<form class="max-w-3xl mx-auto flex gap-2" onsubmit={handleSubmit}>
		<input
			type="text"
			placeholder="Type a message..."
			bind:value={input}
			onkeydown={handleKeydown}
			disabled={isLoading}
			class="flex-1 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent disabled:opacity-50"
		/>
		{#if isLoading}
			<button
				type="button"
				onclick={onStop}
				class="rounded-xl bg-zinc-200 dark:bg-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors cursor-pointer"
			>
				Stop
			</button>
		{:else}
			<button
				type="submit"
				disabled={!input.trim()}
				class="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
			>
				Send
			</button>
		{/if}
	</form>
</div>

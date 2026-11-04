<script lang="ts">
	interface Props {
		/** Shown once there is a conversation to clear. */
		onNewChat?: () => void;
		disabled?: boolean;
	}

	let { onNewChat, disabled = false }: Props = $props();
</script>

<header
	class="shrink-0 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 py-4 flex items-center justify-between gap-4"
>
	<div>
		<h1 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100">OpenUI Svelte Chat</h1>
		<p class="text-xs text-zinc-500 dark:text-zinc-400">
			Powered by @openuidev/svelte-lang & Vercel AI SDK
		</p>
	</div>
	{#if onNewChat}
		<button
			type="button"
			onclick={onNewChat}
			{disabled}
			class="rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
		>
			New chat
		</button>
	{/if}
</header>

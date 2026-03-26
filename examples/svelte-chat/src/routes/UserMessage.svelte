<script lang="ts">
	interface Props {
		parts: any[];
	}

	let { parts }: Props = $props();
</script>

<div class="flex justify-end">
	<div
		class="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-2xl rounded-br-sm px-4 py-2.5 max-w-[80%]"
	>
		{#each parts as part}
			{#if part.type === "text"}
				<p class="text-sm">{part.text}</p>
			{/if}
		{/each}
	</div>
</div>

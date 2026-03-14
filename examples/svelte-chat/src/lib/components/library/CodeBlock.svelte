<script lang="ts">
	import type { ComponentRenderProps } from "@openuidev/svelte-lang";

	interface Props
		extends ComponentRenderProps<{
			language: string;
			codeString: string;
		}> {}

	let { props }: Props = $props();
</script>

<div class="overflow-hidden rounded-lg border bg-zinc-950">
	<div class="flex items-center border-b border-zinc-800 bg-zinc-900 px-4 py-2">
		<span class="text-xs font-medium uppercase tracking-wider text-zinc-400">
			{props.language}
		</span>
	</div>
	<pre class="m-0 overflow-x-auto p-4"><code
			class="font-mono text-sm leading-relaxed text-zinc-200">{props.codeString}</code
		></pre>
</div>

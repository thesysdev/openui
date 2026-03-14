<script lang="ts">
	import type { ComponentRenderProps } from "@openuidev/svelte-lang";

	interface Props
		extends ComponentRenderProps<{
			text: string;
			size?: "small" | "default" | "large" | "small-heavy" | "large-heavy";
		}> {}

	let { props }: Props = $props();

	const sizeClass: Record<string, string> = {
		small: "text-sm text-muted-foreground",
		default: "text-base text-foreground",
		large: "text-lg text-foreground",
		"small-heavy": "text-sm font-semibold text-foreground",
		"large-heavy": "text-2xl font-bold text-foreground",
	};

	const className = $derived(sizeClass[props.size ?? "default"]);
</script>

<p class="{className} m-0 leading-relaxed">{props.text}</p>

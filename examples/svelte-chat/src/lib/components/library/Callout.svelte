<script lang="ts">
	import type { ComponentRenderProps } from "@openuidev/svelte-lang";
	import * as Alert from "$lib/components/ui/alert/index.js";

	interface Props
		extends ComponentRenderProps<{
			variant: "info" | "warning" | "error" | "success" | "neutral";
			title: string;
			description: string;
		}> {}

	let { props }: Props = $props();

	const icons: Record<string, string> = {
		info: "\u2139",
		warning: "\u26A0",
		error: "\u2715",
		success: "\u2713",
		neutral: "\u2022",
	};

	const variantClass: Record<string, string> = {
		info: "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100",
		warning:
			"border-yellow-200 bg-yellow-50 text-yellow-900 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-100",
		error:
			"border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100",
		success:
			"border-green-200 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-100",
		neutral: "border-border bg-muted text-foreground",
	};
</script>

<Alert.Root class={variantClass[props.variant] ?? variantClass.neutral}>
	<span class="text-lg">{icons[props.variant] ?? "\u2022"}</span>
	<Alert.Title>{props.title}</Alert.Title>
	<Alert.Description>{props.description}</Alert.Description>
</Alert.Root>

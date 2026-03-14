<script lang="ts">
	import type { ComponentRenderProps } from "@openuidev/svelte-lang";

	interface Props
		extends ComponentRenderProps<{
			direction?: "row" | "column";
			gap?: "none" | "xs" | "s" | "m" | "l" | "xl";
			align?: "start" | "center" | "end" | "stretch" | "baseline";
			justify?: "start" | "center" | "end" | "between" | "around" | "evenly";
			wrap?: boolean;
			children: unknown[];
		}> {}

	let { props, renderNode }: Props = $props();

	const gapClass: Record<string, string> = {
		none: "gap-0",
		xs: "gap-1",
		s: "gap-2",
		m: "gap-4",
		l: "gap-6",
		xl: "gap-8",
	};

	const alignClass: Record<string, string> = {
		start: "items-start",
		center: "items-center",
		end: "items-end",
		stretch: "items-stretch",
		baseline: "items-baseline",
	};

	const justifyClass: Record<string, string> = {
		start: "justify-start",
		center: "justify-center",
		end: "justify-end",
		between: "justify-between",
		around: "justify-around",
		evenly: "justify-evenly",
	};

	const classes = $derived(
		[
			"flex",
			props.direction === "row" ? "flex-row" : "flex-col",
			gapClass[props.gap ?? "m"],
			alignClass[props.align ?? "stretch"],
			justifyClass[props.justify ?? "start"],
			props.wrap ? "flex-wrap" : "",
		]
			.filter(Boolean)
			.join(" "),
	);
</script>

<div class={classes}>
	{@render renderNode(props.children)}
</div>

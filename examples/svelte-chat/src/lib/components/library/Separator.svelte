<script lang="ts">
	import type { ComponentRenderProps } from "@openuidev/svelte-lang";
	import { Separator } from "$lib/components/ui/separator/index.js";

	interface Props
		extends ComponentRenderProps<{
			orientation?: "horizontal" | "vertical";
		}> {}

	let { props }: Props = $props();
</script>

<Separator orientation={props.orientation ?? "horizontal"} />

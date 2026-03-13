<script lang="ts">
	import type { ComponentRenderProps } from "@openuidev/svelte-lang";
	import * as Card from "$lib/components/ui/card/index.js";

	interface Props
		extends ComponentRenderProps<{
			children: unknown[];
		}> {}

	let { props, renderNode }: Props = $props();
</script>

<Card.Root>
	<Card.Content class="flex flex-col gap-4">
		{@render renderNode(props.children)}
	</Card.Content>
</Card.Root>

<script lang="ts">
	import type { ComponentRenderProps } from "@openuidev/svelte-lang";
	import { setFormNameContext } from "@openuidev/svelte-lang";
	import * as Card from "$lib/components/ui/card/index.js";

	interface Props
		extends ComponentRenderProps<{
			name: string;
			fields: unknown;
			submitButton: unknown;
		}> {}

	let { props, renderNode }: Props = $props();

	// svelte-ignore state_referenced_locally
	const formName = props.name;
	setFormNameContext(formName);
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>{props.name}</Card.Title>
	</Card.Header>
	<Card.Content>
		<form onsubmit={(e) => e.preventDefault()}>
			<div class="space-y-4">
				{@render renderNode(props.fields)}
			</div>
			<div class="mt-4 flex justify-end">
				{@render renderNode(props.submitButton)}
			</div>
		</form>
	</Card.Content>
</Card.Root>

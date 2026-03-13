<script lang="ts">
	import type { ComponentRenderProps } from "@openuidev/svelte-lang";
	import type { ActionConfig } from "@openuidev/svelte-lang";
	import { getTriggerAction, getFormName } from "@openuidev/svelte-lang";
	import { Button } from "$lib/components/ui/button/index.js";

	interface Props
		extends ComponentRenderProps<{
			label: string;
			action?: ActionConfig;
		}> {}

	let { props }: Props = $props();

	const triggerAction = getTriggerAction();
	const formName = getFormName();

	function handleClick() {
		triggerAction(props.label, formName, props.action);
	}
</script>

<Button onclick={handleClick}>
	{props.label}
</Button>

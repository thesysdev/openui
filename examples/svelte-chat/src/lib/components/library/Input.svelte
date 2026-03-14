<script lang="ts">
	import type { ComponentRenderProps } from "@openuidev/svelte-lang";
	import {
		getGetFieldValue,
		getSetFieldValue,
		getFormName,
		useSetDefaultValue,
	} from "@openuidev/svelte-lang";
	import { Input } from "$lib/components/ui/input/index.js";

	interface Props
		extends ComponentRenderProps<{
			name: string;
			label?: string;
			placeholder?: string;
			defaultValue?: string;
		}> {}

	let { props }: Props = $props();

	const getFieldValue = getGetFieldValue();
	const setFieldValue = getSetFieldValue();
	const formName = getFormName();

	const value = $derived(getFieldValue(formName, props.name) ?? "");

	useSetDefaultValue(() => ({
		formName,
		componentType: "Input",
		name: props.name,
		existingValue: value,
		defaultValue: props.defaultValue,
	}));

	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;
		setFieldValue(formName, "Input", props.name, target.value);
	}
</script>

<div class="mb-3 space-y-1.5">
	{#if props.label}
		<label for={props.name} class="text-sm font-medium leading-none">
			{props.label}
		</label>
	{/if}
	<Input
		id={props.name}
		name={props.name}
		type="text"
		placeholder={props.placeholder}
		{value}
		oninput={handleInput}
	/>
</div>

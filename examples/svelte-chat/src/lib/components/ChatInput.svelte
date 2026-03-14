<script lang="ts">
	import { Button } from "$lib/components/ui/button/index.js";

	interface Props {
		value: string;
		disabled?: boolean;
		onSubmit: (message: string) => void;
		onInput: (value: string) => void;
	}

	let { value, disabled = false, onSubmit, onInput }: Props = $props();

	function handleSubmit(event: Event) {
		event.preventDefault();
		if (value.trim() && !disabled) {
			onSubmit(value);
		}
	}

	function handleInput(event: Event) {
		const target = event.target as HTMLTextAreaElement;
		onInput(target.value);
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === "Enter" && !event.shiftKey) {
			event.preventDefault();
			if (value.trim() && !disabled) {
				onSubmit(value);
			}
		}
	}
</script>

<form onsubmit={handleSubmit} class="rounded-lg border bg-card p-4 shadow-sm">
	<div class="flex items-end gap-3">
		<textarea
			{value}
			{disabled}
			placeholder="Type your message... (Shift+Enter for new line)"
			oninput={handleInput}
			onkeydown={handleKeyDown}
			rows="3"
			class="flex-1 resize-y rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
		></textarea>
		<Button type="submit" disabled={disabled || !value.trim()}>
			Send
		</Button>
	</div>
</form>

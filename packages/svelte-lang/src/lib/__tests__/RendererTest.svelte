<script lang="ts">
	import Renderer from '../Renderer.svelte';
	import type { Library } from '../library.js';
	import type { ActionEvent } from '@openuidev/react-lang';

	interface Props {
		response: string | null;
		library: Library;
		isStreaming?: boolean;
		onAction?: (event: ActionEvent) => void;
	}

	let { response, library, isStreaming = false, onAction }: Props = $props();
</script>

<div data-testid="renderer-wrapper">
	<Renderer {response} {library} {isStreaming} {onAction} />
</div>

<script lang="ts">
	import type { ComponentRenderProps } from '../library.js';

	interface Props extends ComponentRenderProps<{
		title: string;
		content: unknown;
	}> {}

	let { props, renderNode }: Props = $props();
</script>

<div data-testid="test-card">
	<h2 data-testid="card-title">{props.title}</h2>
	<div data-testid="card-content">
		{@render renderNode(props.content)}
	</div>
</div>

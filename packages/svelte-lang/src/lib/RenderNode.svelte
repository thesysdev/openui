<script lang="ts">
	import type { Snippet } from "svelte";
	import type { ElementNode } from "@openuidev/react-lang";
	import { getOpenUIContext } from "./context.svelte.js";

	interface Props {
		node: ElementNode;
		renderNode: Snippet<[unknown]>;
	}

	let { node, renderNode }: Props = $props();

	const ctx = getOpenUIContext();

	// Look up the component renderer from the library
	const componentDef = $derived(node ? ctx.library.components[node.typeName] : null);

	// Dynamic component reference for Svelte 5 (replaces deprecated <svelte:component>)
	const Comp = $derived(componentDef?.component);

	// Map positional args to named props if needed (matching react-lang's RenderNodeInner)
	const resolvedProps = $derived.by(() => {
		if (!node || !componentDef) return {};
		if (node.props) return node.props;
		const args = (node as any).args as unknown[] | undefined;
		if (args) {
			const fieldNames = Object.keys(componentDef.props.shape);
			const mapped: Record<string, unknown> = {};
			for (let i = 0; i < fieldNames.length && i < args.length; i++) {
				mapped[fieldNames[i]] = args[i];
			}
			return mapped;
		}
		return {};
	});
</script>

{#if node && Comp}
	<Comp props={resolvedProps} {renderNode} />
{:else if node}
	<!-- Component "{node.typeName}" not found in library -->
{/if}

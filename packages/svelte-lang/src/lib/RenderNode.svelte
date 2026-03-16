<script lang="ts">
	import type { Snippet } from "svelte";
	import type { ElementNode } from "@openuidev/lang-core";
	import { getOpenUIContext } from "./context.svelte.js";

	interface Props {
		node: ElementNode;
		renderNode: Snippet<[unknown]>;
	}

	let { node, renderNode }: Props = $props();

	const ctx = getOpenUIContext();

	const componentDef = $derived(node ? ctx.library.components[node.typeName] : null);
	const Comp = $derived(componentDef?.component);

	// Map positional args to named props (matching react-lang's RenderNodeInner)
	const resolvedProps = $derived.by(() => {
		if (!node || !componentDef) return {};
		if (node.props) return node.props;

		const args = (node as any).args as unknown[] | undefined;
		if (args) {
			const fieldNames = Object.keys(componentDef.props.shape);
			const mapped: Record<string, unknown> = {};
			for (let i = 0; i < fieldNames.length && i < args.length; i++) {
				mapped[fieldNames[i]!] = args[i];
			}
			return mapped;
		}

		return {};
	});

	function handleError(error: unknown) {
		console.error("[openui] Component render error:", error);
	}
</script>

{#if node && Comp}
	<svelte:boundary onerror={handleError}>
		<Comp props={resolvedProps} {renderNode} />
		{#snippet failed()}
			<!-- Error boundary: show nothing on render failure (react-lang keeps last valid render; svelte:boundary does not support that) -->
		{/snippet}
	</svelte:boundary>
{/if}

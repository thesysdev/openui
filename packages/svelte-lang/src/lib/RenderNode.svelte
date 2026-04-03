<script lang="ts">
  import { untrack } from "svelte";
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

  let resetFn: (() => void) | null = $state(null);

  function handleError(error: unknown, reset: () => void) {
    console.error("[openui] Component render error:", error);
    resetFn = reset;
  }

  // Auto-retry when node/props change after a render error (e.g. during streaming).
  // resetFn is read inside untrack() so that consecutive errors with unchanged
  // props don't re-trigger the effect and cause an infinite loop.
  $effect(() => {
    void node;
    void resolvedProps;

    untrack(() => {
      if (resetFn) {
        const fn = resetFn;
        resetFn = null;
        fn();
      }
    });
  });
</script>

{#if node && Comp}
  <svelte:boundary onerror={handleError}>
    <Comp props={resolvedProps} {renderNode} />
    <!-- svelte-ignore block_empty -->
    {#snippet failed()}{/snippet}
  </svelte:boundary>
{/if}

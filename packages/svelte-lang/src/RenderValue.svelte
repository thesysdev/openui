<script lang="ts">
  import { getOpenUI } from "./context.js";
  import type { ElementNode } from "./parser/types.js";
  import RenderNode from "./RenderNode.svelte";

  interface Props {
    value: unknown;
  }

  let { value }: Props = $props();

  const ctx = getOpenUI();
</script>

{#if value == null}
  <!-- null/undefined: render nothing -->
{:else if typeof value === "string"}
  {value}
{:else if typeof value === "number" || typeof value === "boolean"}
  {String(value)}
{:else if Array.isArray(value)}
  {#each value as item, i (i)}
    <svelte:self value={item} />
  {/each}
{:else if typeof value === "object" && value !== null && (value as Record<string, unknown>).type === "element"}
  <RenderNode node={value as unknown as ElementNode} library={ctx.library} />
{/if}

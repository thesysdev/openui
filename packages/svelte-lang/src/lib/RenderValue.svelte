<script lang="ts">
  import type { ElementNode } from "./internal";
  import RenderNode from "./RenderNode.svelte";

  let { value }: { value: unknown } = $props();

  function toElementNode(candidate: unknown): ElementNode | null {
    return typeof candidate === "object" &&
      candidate !== null &&
      (candidate as { type?: string }).type === "element"
      ? (candidate as ElementNode)
      : null;
  }

  function toText(candidate: unknown): string | null {
    if (candidate == null) return null;
    if (typeof candidate === "string") return candidate;
    if (typeof candidate === "number" || typeof candidate === "boolean") return String(candidate);
    return null;
  }
</script>

{#snippet renderValue(currentValue: unknown)}
  {@const arrayValue = Array.isArray(currentValue) ? currentValue : null}
  {@const elementValue = toElementNode(currentValue)}
  {@const textValue = toText(currentValue)}

  {#if arrayValue}
    {#each arrayValue as item, index (index)}
      {@render renderValue(item)}
    {/each}
  {:else if elementValue}
    <RenderNode node={elementValue} />
  {:else if textValue !== null}
    {textValue}
  {/if}
{/snippet}

{@render renderValue(value)}

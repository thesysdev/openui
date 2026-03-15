<script lang="ts">
  import type { Library, DefinedComponent } from "./library.js";
  import type { ElementNode } from "./parser/types.js";

  interface Props {
    node: ElementNode;
    library: Library;
  }

  let { node, library }: Props = $props();

  const def = $derived(library.components[node.typeName]);
  const Comp = $derived(def?.component);

  const resolvedProps = $derived.by(() => {
    if (!def) return {};
    let props = node.props;
    if (!props) {
      const args = (node as any).args as unknown[] | undefined;
      if (args) {
        const fieldNames = Object.keys(def.props.shape);
        props = {};
        for (let i = 0; i < fieldNames.length && i < args.length; i++) {
          props[fieldNames[i]] = args[i];
        }
      }
      props = props ?? {};
    }
    return props;
  });

  /**
   * renderNode function passed to component renderers.
   * Components use this with <RenderValue> to render nested children.
   */
  function renderNode(value: unknown): unknown {
    return value;
  }
</script>

{#if Comp}
  <svelte:component this={Comp} props={resolvedProps} {renderNode} />
{/if}

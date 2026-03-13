<script lang="ts">
  import type { ElementNode } from "./internal";
  import { getOpenUI } from "./context";

  let { node }: { node: ElementNode } = $props();

  const openUI = getOpenUI();
  const openUIState = openUI.state;

  const component = $derived($openUIState?.library.components[node.typeName]?.component ?? null);

  const componentProps = $derived.by(() => {
    let props: Record<string, unknown> | undefined = node.props;
    if (!props) {
      const args = (node as ElementNode & { args?: unknown[] }).args;
      if (args) {
        const definition = $openUIState?.library.components[node.typeName];
        if (definition) {
          const fieldNames = Object.keys(definition.props.shape);
          props = {};
          for (let index = 0; index < fieldNames.length && index < args.length; index += 1) {
            const fieldName = fieldNames[index];
            if (fieldName) {
              props[fieldName] = args[index];
            }
          }
        }
      }
    }

    return props ?? {};
  });
</script>

{#if component}
  {@const DynamicComponent = component}
  <DynamicComponent props={componentProps} renderNode={openUI.renderNode} />
{/if}

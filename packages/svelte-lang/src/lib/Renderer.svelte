<script lang="ts">
  import { createOpenUIController } from "./internal";
  import type { OpenUIController, OpenUIControllerState } from "./internal";
  import { writable } from "svelte/store";
  import { provideOpenUIContext } from "./context";
  import RenderNode from "./RenderNode.svelte";
  import RenderValue from "./RenderValue.svelte";
  import type { Library } from "./library";
  import type { RendererProps } from "./renderer";

  let {
    response = null,
    library,
    isStreaming = false,
    onAction,
    onStateUpdate,
    initialState,
    onParseResult,
  }: RendererProps = $props();

  let controller: OpenUIController<Library> | null = null;
  const controllerState = writable<OpenUIControllerState<Library> | null>(null);

  provideOpenUIContext({
    state: controllerState,
    renderNode: RenderValue,
    triggerAction: (...args) => controller?.triggerAction(...args),
    getFieldValue: (...args) => controller?.getFieldValue(...args),
    setFieldValue: (...args) => controller?.setFieldValue(...args),
  });

  $effect(() => {
    const nextController = createOpenUIController({
      response,
      library,
      isStreaming,
      onAction,
      onStateUpdate,
      initialState,
    });

    controller = nextController;
    controllerState.set(nextController.getState());

    const unsubscribe = nextController.subscribe(() => {
      controllerState.set(nextController.getState());
    });

    return () => {
      unsubscribe();
      if (controller === nextController) {
        controller = null;
      }
    };
  });

  $effect(() => {
    onParseResult?.($controllerState?.result ?? null);
  });
</script>

{#if $controllerState?.result?.root}
  <RenderNode node={$controllerState.result.root} />
{/if}

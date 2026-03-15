<script lang="ts">
  import type { Snippet } from "svelte";
  import { setOpenUIContext } from "./context.js";
  import type { ComponentRenderer, DefinedComponent, Library } from "./library.js";
  import type { ActionEvent, ElementNode, ParseResult } from "./parser/types.js";
  import { createOpenUIState } from "./stores/openui.svelte.js";
  import RenderNode from "./RenderNode.svelte";

  interface Props {
    /** Raw response text (openui-lang code). */
    response: string | null;
    /** Component library from createLibrary(). */
    library: Library;
    /** Whether the LLM is still streaming (form interactions disabled during streaming). */
    isStreaming?: boolean;
    /** Callback when a component triggers an action. */
    onAction?: (event: ActionEvent) => void;
    /**
     * Called whenever a form field value changes. Receives the raw form state map.
     */
    onStateUpdate?: (state: Record<string, any>) => void;
    /**
     * Initial form state to hydrate on load.
     */
    initialState?: Record<string, any>;
    /** Called whenever the parse result changes. */
    onParseResult?: (result: ParseResult | null) => void;
  }

  let {
    response,
    library,
    isStreaming = false,
    onAction,
    onStateUpdate,
    initialState,
    onParseResult,
  }: Props = $props();

  /**
   * Recursively renders a parsed value (element, array, primitive)
   * into Svelte-renderable content. Used by component renderers.
   *
   * In Svelte, we return the raw data and let RenderNode handle rendering.
   * This function is passed to component renderers so they can render
   * nested children.
   */
  function renderDeep(value: unknown): any {
    return value;
  }

  const state = createOpenUIState(
    () => ({
      response,
      library,
      isStreaming,
      onAction,
      onStateUpdate,
      initialState,
    }),
    renderDeep as any,
  );

  // Notify parent when parse result changes
  $effect(() => {
    onParseResult?.(state.result);
  });

  // Set the context for child components
  setOpenUIContext(state.contextValue);
</script>

{#if state.result?.root}
  <RenderNode node={state.result.root} {library} />
{/if}

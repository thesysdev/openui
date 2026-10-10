<script setup lang="ts">
import type {
  ActionEvent,
  ElementNode,
  ParseResult,
  OpenUIError,
  McpClientLike,
  ToolProvider,
} from "@openuidev/lang-core";
import { BuiltinActionType, extractToolResult, ToolNotFoundError } from "@openuidev/lang-core";
import { computed, h, toRaw, toRef, watch, type Component, type VNode } from "vue";
import { provideOpenUIContext } from "./context.js";
import type { Library, RenderNodeResult } from "./library.js";
import RenderNode from "./RenderNode.vue";
import { useOpenUIState } from "./state.js";

interface RendererProps {
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
   * The consumer decides how to persist this (e.g. embed in message, store separately).
   */
  onStateUpdate?: (state: Record<string, any>) => void;
  /**
   * Initial form state to hydrate on load (e.g. from a previously persisted message).
   * Shape: { formName: { fieldName: { value, componentType } } }
   */
  initialState?: Record<string, any>;
  /** Called whenever the parse result changes. */
  onParseResult?: (result: ParseResult | null) => void;
  /** Tool provider for Query()/Mutation() calls. */
  toolProvider?:
    Record<string, (args: Record<string, unknown>) => Promise<unknown>> | McpClientLike | null;
  /** Custom loading indicator shown while queries are fetching. */
  queryLoader?: Component | VNode | null;
  /** Called with structured errors. */
  onError?: (errors: OpenUIError[]) => void;
}

const props = withDefaults(defineProps<RendererProps>(), {
  isStreaming: false,
});

// Stable ToolProvider wrapper — identity never changes. callTool() reads the
// latest input from props.toolProvider on every call, so function map updates
// are always observed without triggering re-creation.
const stableToolProvider: ToolProvider = {
  async callTool(toolName: string, args: Record<string, unknown>): Promise<unknown> {
    const current = props.toolProvider;
    if (current == null) throw new Error("[openui] toolProvider is null");
    if (typeof (current as any).callTool === "function") {
      const result = await (current as any).callTool({
        name: toolName,
        arguments: args,
      });
      return extractToolResult(result);
    }
    const map = current as Record<string, (a: Record<string, unknown>) => Promise<unknown>>;
    const fn = map[toolName];
    if (!fn) throw new ToolNotFoundError(toolName, Object.keys(map));
    return fn(args);
  },
};

const resolvedToolProvider = computed<ToolProvider | null>(() => {
  return props.toolProvider != null ? stableToolProvider : null;
});

// ─── Render node function ───
function renderNode(value: unknown): RenderNodeResult {
  if (value == null) return null;
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    return value.flatMap((item) => {
      const result = renderNode(item);
      return Array.isArray(result) ? result : [result];
    });
  }
  if (typeof value === "object" && (value as any).type === "element") {
    return h(RenderNode, { node: value as ElementNode });
  }
  return null;
}

const { result, parseResult, contextValue, isQueryLoading } = useOpenUIState(
  {
    response: toRef(props, "response"),
    library: toRaw(props.library),
    isStreaming: toRef(props, "isStreaming"),
    onAction: (e) => props.onAction?.(e),
    onStateUpdate: (s) => props.onStateUpdate?.(s),
    initialState: props.initialState,
    toolProvider: resolvedToolProvider,
    onError: (errs) => props.onError?.(errs),
  },
  renderNode,
);

// ─── Notify on parse result change ───
watch(
  parseResult,
  (r) => {
    props.onParseResult?.(r);
  },
  { immediate: true },
);

// ─── Provide context ───
provideOpenUIContext(contextValue.value);
</script>

<template>
  <div style="position: relative">
    <div v-if="isQueryLoading" style="position: absolute; top: 8px; right: 8px; z-index: 10">
      <component v-if="props.queryLoader" :is="props.queryLoader" />
      <div
        v-else
        style="
          width: 16px;
          height: 16px;
          border: 2px solid #e5e7eb;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: openui-spin 0.6s linear infinite;
        "
      />
    </div>
    <div :style="{ opacity: isQueryLoading ? 0.7 : 1, transition: 'opacity 0.2s ease' }">
      <RenderNode v-if="result?.root" :node="result.root" />
    </div>
  </div>
</template>

<style>
@keyframes openui-spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>

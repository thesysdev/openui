// ─── Component definition ───

export { tagSchemaId } from "@openuidev/lang-core";
export { createLibrary, defineComponent } from "./library.js";
export type {
  ComponentGroup,
  ComponentRenderer,
  ComponentRenderProps,
  DefinedComponent,
  Library,
  LibraryDefinition,
  PromptOptions,
  RenderNodeResult,
  SubComponentOf,
} from "./library.js";

// ─── Renderer ───

import type { ActionEvent, ParseResult } from "@openuidev/lang-core";
import type { Library } from "./library.js";

export { default as Renderer } from "./Renderer.vue";

/** Props accepted by the Renderer component. */
export interface RendererProps {
  response: string | null;
  library: Library;
  isStreaming?: boolean;
  onAction?: (event: ActionEvent) => void;
  onStateUpdate?: (state: Record<string, any>) => void;
  initialState?: Record<string, any>;
  onParseResult?: (result: ParseResult | null) => void;
}

// ─── Context (composables for use inside component renderers) ───

export {
  provideFormName,
  provideOpenUIContext,
  useFormName,
  useGetFieldValue,
  useIsStreaming,
  useOpenUI,
  useRenderNode,
  useSetDefaultValue,
  useSetFieldValue,
  useTriggerAction,
} from "./context.js";
export type { ActionConfig, OpenUIContextValue } from "./context.js";

// ─── Form validation ───

export { createFormValidation, provideFormValidation, useFormValidation } from "./validation.js";
export type { FormValidationContextValue } from "./validation.js";

export { builtInValidators, parseRules, parseStructuredRules, validate } from "./validation.js";
export type { ParsedRule, ValidatorFn } from "./validation.js";

// ─── Re-exports from lang-core (parser, types) ───

export { BuiltinActionType } from "@openuidev/lang-core";
export type { ActionEvent, ElementNode, ParseResult } from "@openuidev/lang-core";

export { createParser, createStreamingParser, type LibraryJSONSchema } from "@openuidev/lang-core";

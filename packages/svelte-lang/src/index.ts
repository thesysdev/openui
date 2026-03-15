// define library
export { createLibrary, defineComponent } from "./library.js";
export type {
  ComponentGroup,
  ComponentRenderProps,
  ComponentRenderer,
  DefinedComponent,
  Library,
  LibraryDefinition,
  PromptOptions,
  SubComponentOf,
} from "./library.js";

// openui-lang renderer
export { default as Renderer } from "./Renderer.svelte";

// openui-lang helper components for rendering nested values
export { default as RenderValue } from "./RenderValue.svelte";
export { default as RenderNode } from "./RenderNode.svelte";

// openui-lang action types
export { BuiltinActionType } from "./parser/types.js";
export type { ActionEvent, ElementNode, ParseResult } from "./parser/types.js";

// openui-lang parser (server-side use)
export { createParser, createStreamingParser, type LibraryJSONSchema } from "./parser/index.js";

// openui-lang context (for use inside component renderers)
export {
  getFormName,
  getGetFieldValue,
  getIsStreaming,
  getOpenUI,
  getRenderNode,
  getSetFieldValue,
  getTriggerAction,
  setFormNameContext,
  setOpenUIContext,
} from "./context.js";
export type { OpenUIContextValue } from "./context.js";

// openui-lang stores (Svelte-idiomatic state management)
export { createOpenUIState } from "./stores/openui.svelte.js";
export type { OpenUIStateOptions } from "./stores/openui.svelte.js";

// openui-lang form validation
export {
  createFormValidation,
  getFormValidation,
  setFormValidationContext,
} from "./stores/formValidation.svelte.js";
export type { FormValidationContextValue } from "./stores/formValidation.svelte.js";

// openui-lang validation utilities
export { builtInValidators, parseRules, parseStructuredRules, validate } from "./utils/validation.js";
export type { ParsedRule, ValidatorFn } from "./utils/validation.js";

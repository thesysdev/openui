// define library
export { createLibrary, defineComponent } from "./library";
export type {
  ComponentGroup,
  ComponentRenderProps,
  ComponentRenderer,
  DefinedComponent,
  Library,
  LibraryDefinition,
  PromptOptions,
  SubComponentOf,
  ToolDescriptor,
} from "./library";

// openui-lang renderer
export { Renderer } from "./Renderer";
export type { OpenUIPersistedState, RendererProps } from "./Renderer";

// openui-lang action types
export { ACTION_STEPS } from "./parser/builtins";
export { BuiltinActionType } from "./parser/types";
export type { ActionEvent, ActionPlan, ActionStep, ElementNode, ParseResult } from "./parser/types";

// openui-lang parser (server-side use)
export { createParser, createStreamingParser, type LibraryJSONSchema } from "./parser";

// Standalone prompt generation (no Zod deps — usable on backend)
export { generatePrompt } from "./parser/prompt";
export type { ComponentPromptSpec, McpToolSpec, PromptSpec } from "./parser/prompt";

// openui-lang edit/merge
export { mergeStatements } from "./parser/merge";

// openui-lang context hooks (for use inside component renderers)
export {
  FormNameContext,
  useFormName,
  useGetFieldValue,
  useIsStreaming,
  useRenderNode,
  useSetDefaultValue,
  useSetFieldValue,
  useTriggerAction,
} from "./context";

// Runtime — reactive bindings, store, evaluator, query manager, field binding
export { createMcpTransport, isReactiveAssign, reactive } from "./runtime";
export type {
  EvaluationContext,
  McpClientLike,
  McpConnection,
  McpTool,
  McpTransportConfig,
  ReactiveAssign,
  StateField,
  Transport,
} from "./runtime";

// Unified field state hook — component authors use this
export { useStateField } from "./hooks/useStateField";

// openui-lang form validation
export {
  FormValidationContext,
  useCreateFormValidation,
  useFormValidation,
} from "./hooks/useFormValidation";
export type { FormValidationContextValue } from "./hooks/useFormValidation";

export { builtInValidators, parseRules, parseStructuredRules, validate } from "./utils/validation";
export type { ParsedRule, ValidatorFn } from "./utils/validation";

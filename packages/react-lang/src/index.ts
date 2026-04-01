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
export type { RendererProps } from "./Renderer";

// openui-lang action types
export { ACTION_STEPS, BuiltinActionType } from "@openuidev/lang-core";
export type {
  ActionEvent,
  ActionPlan,
  ActionStep,
  ElementNode,
  ParseResult,
} from "@openuidev/lang-core";

// openui-lang parser (server-side use)
export { createParser, createStreamingParser } from "@openuidev/lang-core";

// Standalone prompt generation (no Zod deps — usable on backend)
export { generatePrompt } from "@openuidev/lang-core";
export type { ComponentPromptSpec, McpToolSpec, PromptSpec } from "@openuidev/lang-core";

// openui-lang edit/merge
export { mergeStatements } from "@openuidev/lang-core";

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
export { createMcpTransport, isReactiveAssign } from "@openuidev/lang-core";
export type {
  EvaluationContext,
  McpClientLike,
  McpConnection,
  McpTool,
  McpTransportConfig,
  ReactiveAssign,
  StateField,
  Transport,
} from "@openuidev/lang-core";
export { reactive } from "./runtime";

// Unified field state hook — component authors use this
export { useStateField } from "./hooks/useStateField";

// openui-lang form validation
export {
  FormValidationContext,
  useCreateFormValidation,
  useFormValidation,
} from "./hooks/useFormValidation";
export type { FormValidationContextValue } from "./hooks/useFormValidation";

export {
  builtInValidators,
  parseRules,
  parseStructuredRules,
  validate,
} from "@openuidev/lang-core";
export type { ParsedRule, ValidatorFn } from "@openuidev/lang-core";

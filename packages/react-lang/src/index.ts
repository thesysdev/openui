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
} from "./library";

// openui-lang renderer
export { Renderer } from "./Renderer";
export type { RendererProps } from "./Renderer";

// openui-lang action types
export { BuiltinActionType } from "@openuidev/lang-core";
export type { ActionEvent, ElementNode, ParseResult } from "@openuidev/lang-core";

// openui-lang parser (server-side use)
export { createParser, createStreamingParser, type LibraryJSONSchema } from "@openuidev/lang-core";

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

// openui-lang form validation
export {
  FormValidationContext,
  useCreateFormValidation,
  useFormValidation,
} from "./hooks/useFormValidation";
export type { FormValidationContextValue } from "./hooks/useFormValidation";

export { builtInValidators, parseRules, parseStructuredRules, validate } from "@openuidev/lang-core";
export type { ParsedRule, ValidatorFn } from "@openuidev/lang-core";

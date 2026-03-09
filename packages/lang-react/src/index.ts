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
export { BuiltinActionType } from "./parser/types";
export type { ActionEvent, ElementNode, ParseResult } from "./parser/types";

// openui-lang parser (server-side use)
export { createParser, createStreamingParser, type LibraryJSONSchema } from "./parser";

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

export { builtInValidators, parseRules, parseStructuredRules, validate } from "./utils/validation";
export type { ParsedRule, ValidatorFn } from "./utils/validation";

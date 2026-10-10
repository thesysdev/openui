// ── Library (framework-generic) ──
export {
  buildSignature,
  createLibrary,
  defineAction,
  defineComponent,
  defineFunction,
  tagSchemaId,
} from "./library";
export type {
  ComponentGroup,
  ComponentRenderProps,
  DefinedAction,
  DefinedComponent,
  DefinedFunction,
  Library,
  LibraryActionEvent,
  LibraryDefinition,
  LibraryExtension,
  LibraryJSONSchema,
  PromptOptions,
  SubComponentOf,
  ToolDescriptor,
} from "./library";

// ── Message protocol ──
export { buildMessage, parseMessage } from "./message";
export type { BuildMessageInput, ParseMessageOptions, ParsedMessage } from "./message";

// ── Parser ──
export { createParser, createStreamingParser, parse } from "./parser";
export type { Parser, StreamParser } from "./parser";
export { walkAST } from "./parser/ast";
export type { ASTNode } from "./parser/ast";
export { ACTION_STEPS, action, steps } from "./parser/builtins";
export type { ActionRef } from "./parser/builtins";
export { enrichErrors } from "./parser/enrich-errors";
export { parseExpression } from "./parser/expressions";
export { tokenize } from "./parser/lexer";
export { mergeStatements } from "./parser/merge";
export { generatePrompt, generateSystemPrompt } from "./parser/prompt";
export type {
  CloudPromptOptions,
  ComponentPromptSpec,
  LibrarySpec,
  PromptSpec,
  SystemPromptOptions,
  SystemPromptSpec,
  ToolSpec,
} from "./parser/prompt";
export { jsonToOpenUI } from "./parser/serialize";
export type { SerializeOptions } from "./parser/serialize";
export { autoClose, split } from "./parser/statements";
export { BuiltinActionType } from "./parser/types";
export type {
  ActionEvent,
  ActionPlan,
  ActionStep,
  ElementNode,
  MutationStatementInfo,
  OpenUIError,
  OpenUIErrorCode,
  OpenUIErrorSource,
  ParseResult,
  QueryStatementInfo,
  ValidationError,
  ValidationErrorCode,
} from "./parser/types";

// ── Reactive schema marker ──
export { isReactiveSchema, markReactive } from "./reactive";

// ── Runtime ──
export { evaluateElementProps, evaluateRoot } from "./runtime/evaluate-tree";
export type { EvalContext } from "./runtime/evaluate-tree";
export { evaluate, isReactiveAssign, stripReactiveAssign } from "./runtime/evaluator";
export type { EvaluationContext, ReactiveAssign } from "./runtime/evaluator";
export { McpToolError, extractToolResult } from "./runtime/mcp";
export type { McpClientLike } from "./runtime/mcp";
export { createQueryManager } from "./runtime/queryManager";
export type {
  MutationNode,
  MutationResult,
  QueryManager,
  QueryNode,
  QuerySnapshot,
  ToolProvider,
} from "./runtime/queryManager";
export { resolveStateField } from "./runtime/state-field";
export type { InferStateFieldValue, StateField } from "./runtime/state-field";
export { createStore } from "./runtime/store";
export type { Store } from "./runtime/store";
export { ToolNotFoundError } from "./runtime/toolProvider";

// ── Validation ──
export { builtInValidators, parseRules, parseStructuredRules, validate } from "./utils/validation";
export type { ParsedRule, ValidatorFn } from "./utils/validation";

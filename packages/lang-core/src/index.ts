// ── Library (framework-generic) ──
export { createLibrary, defineComponent, tagSchemaId } from "./library";
export type {
  ComponentGroup,
  ComponentRenderProps,
  DefinedComponent,
  Library,
  LibraryDefinition,
  LibraryJSONSchema,
  PromptOptions,
  SubComponentOf,
  ToolDescriptor,
} from "./library";

// ── Parser ──
export { createParser, createStreamingParser, parse } from "./parser";
export type { Parser, StreamParser } from "./parser";
export { isASTNode, isRuntimeExpr } from "./parser/ast";
export type { ASTNode, CallNode, RuntimeExprNode, Statement } from "./parser/ast";
export {
  ACTION_NAMES,
  ACTION_STEPS,
  BUILTINS,
  BUILTIN_NAMES,
  LAZY_BUILTINS,
  isBuiltin,
  toNumber,
} from "./parser/builtins";
export type { BuiltinDef } from "./parser/builtins";
export { enrichErrors } from "./parser/enrich-errors";
export { mergeStatements } from "./parser/merge";
export { generatePrompt } from "./parser/prompt";
export type { ComponentPromptSpec, PromptSpec, ToolSpec } from "./parser/prompt";
export { jsonToOpenUI } from "./parser/serialize";
export type { SerializeOptions } from "./parser/serialize";
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
export { evaluateElementProps } from "./runtime/evaluate-tree";
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

export { BuiltinActionType } from "./types";
export type {
  ActionEvent,
  ElementNode,
  LibraryJSONSchema,
  MutationStatementInfo,
  OpenUIError,
  ParamDef,
  ParamMap,
  ParseResult,
  QueryStatementInfo,
  ValidationError,
  ValidationErrorCode,
} from "./types";

export { createParser, createStreamingParser, parse } from "./parser";
export type { Parser, StreamParser } from "./parser";

export { enrichErrors } from "./enrich-errors";

export { generatePrompt } from "./prompt";
export type { ComponentGroup, ComponentPromptSpec, PromptSpec, ToolSpec } from "./prompt";

export { mergeStatements } from "./merge";

// Shared builtin registry
export { BUILTINS, BUILTIN_NAMES, isBuiltin } from "./builtins";
export type { BuiltinDef } from "./builtins";

// Typed statement model + AST utilities
export { isASTNode, isRuntimeExpr } from "./ast";
export type { ASTNode, CallNode, RuntimeExprNode, Statement } from "./ast";

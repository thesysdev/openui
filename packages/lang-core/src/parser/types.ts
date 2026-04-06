import type { ASTNode } from "./ast";

/**
 * The JSON Schema document produced by `library.toJSONSchema()`.
 * All component schemas live in `$defs`, keyed by component name.
 */
export interface LibraryJSONSchema {
  $defs?: Record<
    string,
    {
      properties?: Record<string, unknown>;
      required?: string[];
    }
  >;
}

export interface ParamDef {
  /** Parameter name, e.g. "title", "columns". */
  name: string;
  /** Whether the parameter is required by the component. */
  required: boolean;
  /** Default value from JSON Schema — used when the required field is missing/null. */
  defaultValue?: unknown;
}

/** Internal parameter map for positional-arg to named-prop mapping. */
export type ParamMap = Map<string, { params: ParamDef[] }>;

/**
 * A fully resolved component node from the parser.
 *
 * The parser converts openui-lang text into a tree of these nodes.
 * Each node represents one component invocation with its positional
 * arguments mapped into named `props` via the library's Zod key order.
 */
export interface ElementNode {
  type: "element";
  /** Source variable name (e.g. "header" from `header = TextContent(...)`). Undefined for inline components. */
  statementId?: string;
  /** Component name as defined in the library (e.g. "Table", "BarChart"). */
  typeName: string;
  /** Named props produced by positional-to-named mapping in the parser. */
  props: Record<string, unknown>;
  /**
   * True when the parser hasn't received all tokens for this node yet
   * (streaming in progress).
   */
  partial: boolean;
  /**
   * False when all props are static literals — evaluation can be skipped.
   * Undefined is treated as true (dynamic) for backward compatibility.
   */
  hasDynamicProps?: boolean;
}

export function isElementNode(value: unknown): value is ElementNode {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const node = value as Record<string, unknown>;
  return (
    node.type === "element" &&
    typeof node.typeName === "string" &&
    typeof node.props === "object" &&
    node.props !== null &&
    typeof node.partial === "boolean"
  );
}

/**
 * Validation error codes for schema-related issues.
 */
export type ValidationErrorCode =
  | "missing-required"
  | "null-required"
  | "unknown-component"
  | "inline-reserved";

/**
 * A prop validation error. Components with missing required props are
 * dropped from the output tree and errors are recorded here.
 */
export interface ValidationError {
  /** Machine-readable error code. */
  code: ValidationErrorCode;
  /** Component type name, e.g. "Header", "BarChart". */
  component: string;
  /** JSON Pointer path within the props object, e.g. "/title", "". */
  path: string;
  /** Human-readable error message. */
  message: string;
  /** Statement name that triggered the error (e.g. "header", "chart"). */
  statementId?: string;
}

/**
 * Error sources across the openui-lang pipeline.
 */
export type OpenUIErrorSource = "parser" | "runtime" | "query" | "mutation";

/**
 * Machine-readable error codes for the openui-lang pipeline.
 *
 * - Parser: "unknown-component", "missing-required", "null-required", "inline-reserved",
 *   "parse-exception", "parse-failed"
 * - Runtime: "runtime-error" (prop evaluation), "render-error" (React render)
 * - Query/Mutation: "tool-not-found", "tool-error", "mcp-error"
 */
export type OpenUIErrorCode =
  | ValidationErrorCode
  | "runtime-error"
  | "render-error"
  | "parse-exception"
  | "parse-failed"
  | "tool-not-found"
  | "tool-error"
  | "mcp-error";

/**
 * Structured, LLM-friendly error from the openui-lang pipeline.
 *
 * Designed for an automated correction loop: send these to the LLM so it can
 * generate patches. Only includes errors that are fixable by changing the
 * openui-lang code — transient streaming errors, network failures, and tool
 * execution errors are excluded.
 */
export interface OpenUIError {
  /** Where the error originated. */
  source: OpenUIErrorSource;
  /** Machine-readable error code. */
  code: OpenUIErrorCode;
  /** Human/LLM-readable description of what went wrong. */
  message: string;
  /** Statement name (e.g. "header", "metrics") — tells the LLM which statement to patch. */
  statementId?: string;
  /** Component type name (e.g. "BarChart", "Query"). */
  component?: string;
  /** Prop path (e.g. "/title"). */
  path?: string;
  /** Tool name for query/mutation errors (e.g. "get_users", "create_item"). */
  toolName?: string;
  /** Actionable fix context for the LLM (e.g. available components, correct signature). */
  hint?: string;
}

/**
 * Built-in action types for host app events.
 */
export enum BuiltinActionType {
  ContinueConversation = "continue_conversation",
  OpenUrl = "open_url",
}

/**
 * A single step in an ActionPlan.
 * Step type values match ACTION_STEPS in builtins.ts (single source of truth).
 */
export type ActionStep =
  | { type: "run"; statementId: string; refType: "query" | "mutation" }
  | { type: "continue_conversation"; message: string; context?: string }
  | { type: "open_url"; url: string }
  | { type: "set"; target: string; valueAST: ASTNode }
  | { type: "reset"; targets: string[] };

/**
 * An ordered sequence of steps to execute when a button is clicked.
 * Produced by evaluating an Action() expression at runtime.
 */
export interface ActionPlan {
  steps: ActionStep[];
}

/**
 * Structured action event fired by interactive components.
 */
export interface ActionEvent {
  /** Action type. See `BuiltinActionType` for built-in types. */
  type: BuiltinActionType | (string & {});
  /** Action-specific params (e.g. { url } for OpenUrl, custom params for Custom). */
  params: Record<string, unknown>;
  /** Human-readable label for the action (displayed as user message in chat). */
  humanFriendlyMessage: string;
  /** Raw form state at the time of the action — all field values. */
  formState?: Record<string, unknown>;
  /** The form name that triggered this action, if any. */
  formName?: string;
}

/**
 * Extracted info about a Query() call from the parsed program.
 */
export interface QueryStatementInfo {
  /** Statement name that holds this query (e.g. "metrics"). */
  statementId: string;
  /** First arg AST — the tool name (should evaluate to a string). */
  toolAST: ASTNode | null;
  /** Second arg AST — the arguments object (may contain $var refs). */
  argsAST: ASTNode | null;
  /** Third arg AST — default data returned before fetch resolves. */
  defaultsAST: ASTNode | null;
  /** Fourth arg AST — refresh interval in seconds. */
  refreshAST: ASTNode | null;
  /** Pre-computed $variable deps from argsAST (extracted at parse time). */
  deps?: string[];
  /** False while the Query() call is still being streamed. */
  complete: boolean;
}

/**
 * Extracted info about a Mutation() call from the parsed program.
 */
export interface MutationStatementInfo {
  /** Statement name that holds this mutation (e.g. "createResult"). */
  statementId: string;
  /** First arg AST — the tool name (should evaluate to a string). */
  toolAST: ASTNode | null;
  /** Second arg AST — the arguments object (may contain $var refs). */
  argsAST: ASTNode | null;
}

/**
 * The output of a single `parser.parse(text)` call.
 *
 * During streaming, each chunk produces a new ParseResult as the
 * accumulated text is re-parsed. The `root` progressively resolves
 * from null → partial tree → complete tree.
 */
export interface ParseResult {
  /** The root ElementNode (typically a Root component), or null if parsing hasn't produced one yet. */
  root: ElementNode | null;
  meta: {
    /** True if the parser detected truncated/incomplete input. */
    incomplete: boolean;
    /** Names of references used but not yet defined (dropped as null in output). */
    unresolved: string[];
    /** Total number of `identifier = Expression` statements parsed. */
    statementCount: number;
    /**
     * Prop validation errors. Components with missing required props are
     * redacted (dropped as null) and listed here.
     */
    errors: ValidationError[];
  };
  /** $variable declarations — maps "$varName" to its materialized default value. */
  stateDeclarations: Record<string, unknown>;
  /** Extracted Query() calls with their positional args as AST nodes. */
  queryStatements: QueryStatementInfo[];
  /** Extracted Mutation() calls with their positional args as AST nodes. */
  mutationStatements: MutationStatementInfo[];
}

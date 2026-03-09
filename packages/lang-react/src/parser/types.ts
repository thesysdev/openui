/**
 * A fully resolved component node from the parser.
 *
 * The parser converts openui-lang text into a tree of these nodes.
 * Each node represents one component invocation with its positional
 * arguments mapped into named `props` via the library's Zod key order.
 */
export interface ElementNode {
  type: "element";
  /** Component name as defined in the library (e.g. "Table", "BarChart"). */
  typeName: string;
  /** Named props produced by positional-to-named mapping in the Rust parser. */
  props: Record<string, unknown>;
  /**
   * True when the parser hasn't received all tokens for this node yet
   * (streaming in progress).
   */
  partial: boolean;
}

/**
 * A prop validation error from the Rust parser.
 * When a component has missing required props, it is redacted from the
 * output tree (dropped as null) and errors are recorded here.
 */
export interface ValidationError {
  /** Component type name, e.g. "Header", "BarChart". */
  component: string;
  /** JSON Pointer path within the props object, e.g. "/title", "". */
  path: string;
  /** Human-readable error message. */
  message: string;
}

/**
 * Built-in action types for interactive components.
 */
export enum BuiltinActionType {
  ContinueConversation = "continue_conversation",
  OpenUrl = "open_url",
}

/**
 * Structured action event fired by interactive components.
 */
export interface ActionEvent {
  /** Action type. See `BuiltinActionType` for built-in types. */
  type: string;
  /** Action-specific params (e.g. { url } for OpenUrl, custom params for Custom). */
  params: Record<string, any>;
  /** Human-readable label for the action (displayed as user message in chat). */
  humanFriendlyMessage: string;
  /** Raw form state at the time of the action — all field values. */
  formState?: Record<string, any>;
  /** The form name that triggered this action, if any. */
  formName?: string;
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
    validationErrors: ValidationError[];
  };
}

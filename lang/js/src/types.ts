/**
 * A validation error from the parser.
 * When a type has missing required props or fails Zod validation,
 * the node is redacted (dropped as null) and errors are recorded here.
 */
export interface ValidationError {
  /** Type name, e.g. "Contact", "Invoice". */
  type: string;
  /** JSON Pointer path within the props object, e.g. "/title", "". */
  path: string;
  /** Human-readable error message. */
  message: string;
}

/**
 * The output of a single `parse()` call.
 *
 * During streaming, each chunk produces a new ParseResult as the
 * accumulated text is re-parsed. The `root` progressively resolves
 * from null → partial object → complete object.
 */
export interface ParseResult<T = unknown> {
  /** The root data object, or null if parsing hasn't produced one yet. */
  root: T | null;
  meta: {
    /** The type name of the root model that was matched, or null if none. */
    rootType: string | null;
    /** True if the parser detected truncated/incomplete input. */
    incomplete: boolean;
    /** Names of references used but not yet defined (dropped as null in output). */
    unresolved: string[];
    /** Total number of `identifier = Expression` statements parsed. */
    statementCount: number;
    /**
     * Validation errors. Types with missing required props or failing Zod
     * validation are redacted (dropped as null) and listed here.
     */
    validationErrors: ValidationError[];
  };
}

/**
 * A streaming parser that accumulates chunks of OpenUI Lang text
 * and produces updated ParseResults on each push.
 */
export interface StreamingParser<T = unknown> {
  /** Feed the next SSE/stream chunk and get the latest ParseResult. */
  push(chunk: string): ParseResult<T>;
  /** Get the latest ParseResult without consuming new data. */
  getResult(): ParseResult<T>;
}

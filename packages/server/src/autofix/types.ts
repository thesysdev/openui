import type { LibraryJSONSchema, LibrarySpec } from "@openuidev/lang-core";
import type {
  ChatCompletionChunk,
  ChatCompletionMessageParam,
} from "openai/resources/chat/completions";

export const MAX_AUTOFIX_GENERATION_LENGTH = 100_000;

export interface AutofixOptions {
  apiKey: string;
  /** The same generated library spec used by the renderer. Schema is required for local checks. */
  library: LibrarySpec & { schema: LibraryJSONSchema };
  /** Origin of the Gateway; defaults to https://api.thesys.dev. */
  apiBaseUrl?: string;
  fetch?: typeof globalThis.fetch;
}

export interface AutofixDiagnostic {
  code: string;
  message: string;
  component?: string;
  path?: string;
  statementId?: string;
}

export type AutofixResult = {
  original: string;
  fixedErrors: AutofixDiagnostic[];
  unfixedErrors: AutofixDiagnostic[];
} & (
  { status: "already_valid" | "fixed"; content: string } | { status: "fix_failed"; content: null }
);

export interface AutofixInput {
  /** Context before the generated assistant message. The wrapper appends that message itself. */
  messages?: ChatCompletionMessageParam[];
  signal?: AbortSignal;
}

export type StreamSource<T> = AsyncIterable<T> & { controller?: AbortController };

export interface AutofixStreamInput<
  Input = ChatCompletionChunk,
  Output = ChatCompletionChunk,
> extends AutofixInput {
  source: StreamSource<NoInfer<Input>>;
  /** Select the source and output protocol; defaults to Chat Completions. */
  adapter?: StreamAdapter<Input, Output>;
}

/** Wrap provider events with validation and repair while preserving the selected output protocol. */
export interface StreamAdapter<Input, Output> {
  /** SSE format for emitted events; transform must produce chunks compatible with this protocol. */
  protocol: string;
  /** Forward events and use fix to validate completed UI before emitting its completion marker. */
  transform(
    source: StreamSource<Input>,
    fix: (generation: string) => Promise<AutofixResult>,
  ): AsyncGenerator<Output>;
}

export interface AutofixStream<T> {
  /** Single consumer. Preserves provider chunks and appends the corrected program before UI completion. */
  chunks: AsyncIterable<T>;
  /** Alternative to consuming chunks: SSE in the selected adapter's protocol. */
  toResponse(): Response;
}

/** Stream and request failures throw; exhausted repairs include their diagnostics. */
export class AutofixError extends Error {
  // Attach a code and optional HTTP status or repair result to the error.
  constructor(
    message: string,
    readonly code: string,
    readonly status?: number,
    readonly result?: AutofixResult,
  ) {
    super(message);
    this.name = "AutofixError";
  }
}

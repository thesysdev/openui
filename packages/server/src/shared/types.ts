import type { LibraryJSONSchema, LibrarySpec } from "@openuidev/lang-core";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

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

export interface BaseAutofixInput {
  /** Context before the generated assistant message. The wrapper appends that message itself. */
  messages?: ChatCompletionMessageParam[];
  signal?: AbortSignal;
}

export interface AutofixInput extends BaseAutofixInput {
  generation: string;
}

export type StreamSource<T> = AsyncIterable<T> & { controller?: AbortController };

export interface AutofixStreamInput<Chunk> extends BaseAutofixInput {
  /** Native SDK events for the selected import path. */
  stream: StreamSource<Chunk>;
}

/** Wrap provider events with validation and repair while preserving the selected output protocol. */
export interface StreamAdapter<Chunk> {
  /** SSE format for emitted events; transform must produce chunks compatible with this protocol. */
  protocol: "openai-chat-completions" | "vercel-ai";
  /** Forward events and use fix to validate completed UI before emitting its completion marker. */
  transform(
    source: StreamSource<Chunk>,
    fix: (generation: string) => Promise<AutofixResult>,
  ): AsyncGenerator<Chunk>;
}

export interface AutofixStream<T> {
  /** Single consumer. Preserves provider chunks and appends the corrected program before UI completion. */
  chunks: AsyncIterable<T>;
  /** Alternative to consuming chunks: SSE in the selected adapter's protocol. */
  toResponse(): Response;
  /** Settles after chunks or toResponse() finish. Null when Autofix did not run. Persist content, not joined deltas. */
  result: Promise<AutofixResult | null>;
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

import type { LibraryJSONSchema, LibrarySpec } from "@openuidev/lang-core";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

export const MAX_AUTOFIX_GENERATION_LENGTH = 100_000;

export interface CreateAutofixParams {
  /** The same generated library spec used by the renderer. Schema is required for local checks. */
  library: LibrarySpec & { schema: LibraryJSONSchema };
}

export interface AutofixOptions extends CreateAutofixParams {
  apiKey: string;
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

/** Wraps provider events with validation and repair, keeping their output protocol. */
export interface StreamAdapter<Chunk> {
  /** SSE format for emitted events; `transform` must yield chunks in it. */
  protocol: "openai-chat-completions" | "vercel-ai";
  /** Forwards events, using `fix` on completed UI before its completion marker. */
  transform(
    source: StreamSource<Chunk>,
    fix: (generation: string) => Promise<AutofixResult>,
  ): AsyncGenerator<Chunk>;
}

export interface AutofixStream<T> {
  /** Single consumer. Provider chunks, plus the corrected program before UI completion. */
  chunks: AsyncIterable<T>;
  /** Alternative to consuming chunks: SSE in the selected adapter's protocol. */
  toResponse(): Response;
  /**
   * Settles after chunks or toResponse() finish. Null when Autofix did not run.
   * Persist its content, not the joined deltas.
   */
  result: Promise<AutofixResult | null>;
}

/** Stream and request failures throw; exhausted repairs include their diagnostics. */
export class AutofixError extends Error {
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

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

export interface AutofixStreamInput extends AutofixInput {
  /** Preserve Chat Completions emissions, or supply text deltas for a text-only integration. */
  source: (AsyncIterable<ChatCompletionChunk> | AsyncIterable<string>) & {
    controller?: AbortController;
  };
}

export type AutofixStreamResult = { id: string; index: number } & (
  | AutofixResult
  | {
      status: "skipped";
      reason: "tool_call" | "refusal" | "incomplete" | "no_ui" | "too_large";
      /** Null when text exceeded the bounded accumulation buffer. Original chunks still pass through. */
      content: string | null;
    }
);

export interface AutofixStream {
  /** Single consumer. Preserves provider chunks and inserts validated text patches before UI completion. */
  chunks: AsyncIterable<ChatCompletionChunk>;
  /** One outcome per completion ID and choice. Settles as chunks are consumed. */
  result: Promise<AutofixStreamResult[]>;
  /** Alternative to consuming chunks: OpenAI Chat Completions SSE for openAIAdapter(). */
  toResponse(): Response;
}

/** Transport/protocol/stream failures throw; an exhausted repair is also available as result. */
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

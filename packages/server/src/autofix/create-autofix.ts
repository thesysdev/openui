import { createParser, generateSystemPrompt } from "@openuidev/lang-core";
import { createAutofixStream } from "./stream";
import type {
  AutofixInput,
  AutofixOptions,
  AutofixResult,
  AutofixStream,
  AutofixStreamInput,
} from "./types";
import { AutofixError, MAX_AUTOFIX_GENERATION_LENGTH } from "./types";
import { errorsOf, readCompletion, repairContext } from "./utils";

/** Validate locally and repair via Gateway only when needed. Does not own model generation. */
export function createAutofix(options: AutofixOptions): {
  fix(input: AutofixInput & { generation: string }): Promise<AutofixResult>;
  stream(input: AutofixStreamInput): AutofixStream;
} {
  const { library } = options;
  if (!library?.schema)
    throw new AutofixError("A library spec with schema is required", "invalid_library");
  const parser = createParser(library.schema, library.root);
  const endpoint = `${(options.apiBaseUrl ?? "https://api.thesys.dev").replace(/\/+$/, "")}/v1/autofix`;
  const fetchFn = options.fetch ?? globalThis.fetch;

  async function fix({
    generation,
    messages = [],
    signal,
  }: AutofixInput & { generation: string }): Promise<AutofixResult> {
    signal?.throwIfAborted();
    if (generation.length > MAX_AUTOFIX_GENERATION_LENGTH) {
      throw new AutofixError("Generation exceeds 100,000 characters", "generation_too_large");
    }
    const initialErrors = errorsOf(parser.parse(generation));
    if (initialErrors.length === 0) {
      return {
        status: "already_valid",
        original: generation,
        content: generation,
        fixedErrors: [],
        unfixedErrors: [],
      };
    }

    const response = await fetchFn(endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${options.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          { role: "system", content: generateSystemPrompt({ cloud: true, library }) },
          ...repairContext(messages),
          { role: "assistant", content: generation },
        ],
      }),
      signal,
    });
    signal?.throwIfAborted();
    if (!response.ok) {
      throw new AutofixError(
        `Autofix request failed: HTTP ${response.status}`,
        "http_error",
        response.status,
      );
    }
    let body: unknown;
    try {
      body = await response.json();
    } catch (error) {
      signal?.throwIfAborted();
      throw new AutofixError(
        `Could not read Autofix response: ${String(error)}`,
        "invalid_response",
      );
    }
    signal?.throwIfAborted();
    const completion = readCompletion(body);
    if (completion.status === "fix_failed") {
      return { ...completion, status: "fix_failed", content: null, original: generation };
    }
    return {
      ...completion,
      status: completion.status,
      original: generation,
      content: completion.content!,
    };
  }

  return { fix, stream: (input) => createAutofixStream(input, fix) };
}

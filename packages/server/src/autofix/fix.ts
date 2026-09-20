import { generateSystemPrompt, type Parser } from "@openuidev/lang-core";
import type { AutofixInput, AutofixOptions, AutofixResult } from "./types";
import { AutofixError, MAX_AUTOFIX_GENERATION_LENGTH } from "./types";
import { errorsOf, readCompletion, repairContext } from "./utils";

// Return valid programs unchanged and send invalid programs to the Autofix API.
export async function fixGeneration(
  {
    library,
    apiKey,
    parser,
    endpoint,
    fetchFn,
  }: Pick<AutofixOptions, "library" | "apiKey"> & {
    parser: Parser;
    endpoint: string;
    fetchFn: typeof globalThis.fetch;
  },
  { generation, messages = [], signal }: AutofixInput & { generation: string },
): Promise<AutofixResult> {
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
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
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
    throw new AutofixError(`Could not read Autofix response: ${String(error)}`, "invalid_response");
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

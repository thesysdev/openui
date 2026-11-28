import { generateSystemPrompt, type Parser } from "@openuidev/lang-core";
import { OpenUIApiError } from "../core/errors";
import type { CloudApi } from "../core/http";
import { errorsOf, readCompletion, repairContext } from "./diagnostics";
import type { AutofixInput, AutofixResult, CreateAutofixParams } from "./types";
import { AutofixError, MAX_AUTOFIX_GENERATION_LENGTH } from "./types";

// Return valid programs unchanged and send invalid programs to the Autofix API.
export async function fixGeneration(
  { library, parser, api }: CreateAutofixParams & { parser: Parser; api: CloudApi },
  { generation, messages = [], signal }: AutofixInput,
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

  let response: Response;
  try {
    response = await api.request("POST", "/v1/autofix", {
      body: {
        messages: [
          { role: "system", content: generateSystemPrompt({ cloud: true, library }) },
          ...repairContext(messages),
          { role: "assistant", content: generation },
        ],
      },
      signal,
    });
  } catch (error) {
    // The client's own failures, such as a missing API key, fail Autofix like any other.
    if (error instanceof OpenUIApiError) {
      throw new AutofixError(error.message, error.code, error.status);
    }
    throw error;
  }
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

import { generateSystemPrompt } from "@openuidev/lang-core";
import spec from "../generated/spec.json";
import { completionSchema, type AutofixInput } from "./contract";

export const DEFAULT_AUTOFIX_URL = "https://api.thesys.dev/v1/autofix";

export class AutofixError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export function buildAutofixRequest(input: AutofixInput) {
  return {
    model: "openui/autofix",
    stream: false,
    messages: [
      // Autofix requires the actual library in the FIRST system/developer turn.
      {
        role: "system",
        content: generateSystemPrompt({ cloud: true, library: spec }),
      },
      ...input.context,
      { role: "assistant", content: input.generation },
    ],
  };
}

/** Server-only transport. The browser calls our Next route; it never receives this key. */
export async function requestAutofix(
  input: AutofixInput,
  options: {
    apiKey: string;
    url?: string;
    signal?: AbortSignal;
    fetcher?: typeof fetch;
  },
) {
  const response = await (options.fetcher ?? fetch)(
    options.url ?? DEFAULT_AUTOFIX_URL,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${options.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildAutofixRequest(input)),
      signal: options.signal,
      cache: "no-store",
    },
  );
  if (!response.ok) {
    const messages: Record<number, string> = {
      400: "Autofix rejected the request. Check the program and context limits, and use a backend with config-message support.",
      401: "The server's THESYS_API_KEY is missing or invalid.",
      403: "The API key does not have access to Autofix.",
      404: "Autofix is unavailable at this URL. Check AUTOFIX_API_URL and the backend deployment.",
      429: "Autofix is rate limited or the account has insufficient credits. Try again later or check your account.",
    };
    throw new AutofixError(
      messages[response.status] ??
        "The Autofix service could not complete this request. Try again.",
      response.status >= 500 ? 502 : response.status,
    );
  }
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new AutofixError("Autofix returned an unexpected response.", 502);
  }
  const data = completionSchema.safeParse(body);
  if (!data.success)
    throw new AutofixError("Autofix returned an unexpected response.", 502);
  return data.data;
}

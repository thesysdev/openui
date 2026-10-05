import { THESYS_API_BASE_URL } from "./constants";

export interface ClientOptions {
  /** Defaults to process.env.THESYS_API_KEY. */
  apiKey?: string;
  /** Gateway origin, without /v1. */
  apiBaseUrl?: string;
  fetch?: typeof globalThis.fetch;
}

export interface ClientConfig {
  apiKey: string;
  apiBaseUrl: string;
  fetch: typeof globalThis.fetch;
}

export class ServerClientError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "ServerClientError";
  }
}

/** Resolve server configuration once, without retaining request or user state. */
export function resolveClientOptions(options: ClientOptions = {}): ClientConfig {
  const apiKey =
    options.apiKey ?? (typeof process !== "undefined" ? process.env["THESYS_API_KEY"] : undefined);
  if (!apiKey?.trim()) {
    throw new ServerClientError(
      "Set THESYS_API_KEY or pass apiKey to createClient",
      "missing_api_key",
    );
  }
  return {
    apiKey,
    apiBaseUrl: (options.apiBaseUrl ?? THESYS_API_BASE_URL).replace(/\/+$/, ""),
    fetch: options.fetch ?? globalThis.fetch,
  };
}

/** Send a Gateway JSON request without retrying writes or tool execution. */
export async function postJSON(
  config: ClientConfig,
  path: string,
  body: unknown,
  signal?: AbortSignal,
): Promise<unknown> {
  signal?.throwIfAborted();
  const response = await config.fetch(`${config.apiBaseUrl}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal,
  });
  if (!response.ok) {
    const text = await response.text();
    signal?.throwIfAborted();
    let code = "http_error";
    let message = text;
    try {
      const parsed = JSON.parse(text) as { error?: { code?: string; message?: string } };
      if (typeof parsed?.error?.code === "string") code = parsed.error.code;
      if (typeof parsed?.error?.message === "string") message = parsed.error.message;
    } catch {
      // Preserve plain-text upstream errors.
    }
    throw new ServerClientError(
      message || `Gateway request failed: HTTP ${response.status}`,
      code,
      response.status,
    );
  }
  try {
    const result: unknown = await response.json();
    signal?.throwIfAborted();
    return result;
  } catch (error) {
    signal?.throwIfAborted();
    throw new ServerClientError(
      `Could not read Gateway response: ${String(error)}`,
      "invalid_response",
      response.status,
    );
  }
}

import { THESYS_API_BASE_URL } from "../shared/constants";
import { OpenUIApiError, type OpenUIClientOptions } from "./types";

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

interface CloudRequest {
  method?: "GET" | "POST";
  headers?: Record<string, string>;
  body?: string;
  signal?: AbortSignal;
}

/** Authenticated requests to OpenUI Cloud with the API key. */
export interface CloudApi {
  /** The client's app, if it has one. */
  readonly appId?: string;
  /** POSTs JSON and resolves with the JSON object OpenUI Cloud returns. */
  post(
    path: string,
    body: unknown,
    signal?: AbortSignal,
    headers?: Record<string, string>,
  ): Promise<Record<string, unknown>>;
  /** POSTs JSON with `stream: true` and yields each event OpenUI Cloud sends, until `[DONE]`. */
  stream(path: string, body: unknown, signal?: AbortSignal): AsyncIterable<Record<string, unknown>>;
}

/** The error a failed OpenUI Cloud response describes. */
export async function apiError(response: Response): Promise<OpenUIApiError> {
  let result: unknown;
  try {
    result = await response.json();
  } catch {
    result = undefined;
  }
  const error = isRecord(result) && isRecord(result["error"]) ? result["error"] : undefined;
  const message = error?.["message"] ?? (isRecord(result) ? result["message"] : undefined);
  return new OpenUIApiError(
    typeof message === "string" ? message : `OpenUI Cloud request failed: HTTP ${response.status}`,
    typeof error?.["code"] === "string" ? error["code"] : "http_error",
    response.status,
  );
}

const envApiKey = (): string | undefined =>
  (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.[
    "THESYS_API_KEY"
  ];

export function createCloudApi(options: OpenUIClientOptions): CloudApi {
  const base = (options.baseUrl ?? THESYS_API_BASE_URL).replace(/\/+$/, "");
  const fetchFn: typeof globalThis.fetch = (input, init) =>
    (options.fetch ?? globalThis.fetch)(input, init);

  // Read on each request, so creating the client at import time never throws.
  const authorization = () => {
    const apiKey = options.apiKey ?? envApiKey();
    if (!apiKey?.trim()) {
      throw new OpenUIApiError(
        "Set THESYS_API_KEY, or pass apiKey to new OpenUIClient()",
        "missing_api_key",
      );
    }
    return `Bearer ${apiKey}`;
  };

  async function request(path: string, { headers, ...init }: CloudRequest = {}) {
    return fetchFn(`${base}${path}`, {
      ...init,
      headers: { ...headers, Authorization: authorization() },
    });
  }

  return {
    ...(options.appId !== undefined && { appId: options.appId }),
    async post(path, body, signal, headers) {
      const response = await request(path, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal,
      });
      if (!response.ok) throw await apiError(response);
      let result: unknown;
      try {
        result = await response.json();
      } catch {
        result = undefined;
      }
      if (!isRecord(result)) {
        throw new OpenUIApiError("Invalid OpenUI Cloud response", "invalid_response", 502);
      }
      return result;
    },
    async *stream(path, body, signal) {
      const response = await request(path, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
        body: JSON.stringify({ ...(body as object), stream: true }),
        signal,
      });
      if (!response.ok) throw await apiError(response);
      if (!response.body) {
        throw new OpenUIApiError("Invalid OpenUI Cloud response", "invalid_response", 502);
      }
      const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = "";
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) return;
          buffer += value;
          let end: number;
          while ((end = buffer.indexOf("\n")) !== -1) {
            const line = buffer.slice(0, end).trim();
            buffer = buffer.slice(end + 1);
            if (!line.startsWith("data:")) continue;
            const data = line.slice(5).trim();
            if (data === "[DONE]") return;
            const event: unknown = JSON.parse(data);
            if (!isRecord(event)) continue;
            yield event;
          }
        }
      } finally {
        // Also when the caller stops reading early: closes the connection.
        await reader.cancel().catch(() => {});
      }
    },
  };
}

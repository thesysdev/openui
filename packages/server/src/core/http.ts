import { THESYS_API_BASE_URL } from "./constants";
import { invalidResponse, OpenUIApiError } from "./errors";
import { isRecord } from "./guards";

export interface OpenUIClientOptions {
  /** Defaults to the `THESYS_API_KEY` environment variable. */
  apiKey?: string;
  /** OpenUI Cloud origin, without /v1. Defaults to https://api.thesys.dev. */
  baseUrl?: string;
  /**
   * Your app, when one API key serves several: users' frontend tokens and
   * artifacts belong to it, and generated scripts run only from it.
   */
  appId?: string;
  fetch?: typeof globalThis.fetch;
}

/** Query string values; `undefined` ones are left out, arrays repeat the name. */
export type CloudQuery = Record<string, string | readonly string[] | undefined>;

export interface CloudSendOptions {
  query?: CloudQuery;
  /** Sent as JSON. */
  body?: unknown;
  signal?: AbortSignal;
  headers?: Record<string, string>;
}

/** Authenticated requests to OpenUI Cloud with the API key. */
export interface CloudApi {
  /** The client's app, if it has one. */
  readonly appId?: string;
  /** Sends a request with the API key and resolves with the raw response, whatever its status. */
  request(
    method: "GET" | "POST" | "DELETE",
    path: string,
    options?: CloudSendOptions,
  ): Promise<Response>;
  /** Sends a request and resolves with the JSON object OpenUI Cloud returns. */
  send(
    method: "GET" | "POST" | "DELETE",
    path: string,
    options?: CloudSendOptions,
  ): Promise<Record<string, unknown>>;
  /** POSTs JSON with `stream: true` and yields each event OpenUI Cloud sends, until `[DONE]`. */
  stream(path: string, body: unknown, signal?: AbortSignal): AsyncIterable<Record<string, unknown>>;
}

/** The response's JSON, or `undefined` when it has none. */
async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

/** The error a failed OpenUI Cloud response describes. */
export async function apiError(response: Response): Promise<OpenUIApiError> {
  const result = await readJson(response);
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
  if (options.appId !== undefined && (typeof options.appId !== "string" || !options.appId.trim())) {
    throw new OpenUIApiError("appId must be a non-empty string", "invalid_input");
  }
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

  function url(path: string, query: CloudQuery = {}) {
    const search = new URLSearchParams();
    for (const [name, value] of Object.entries(query)) {
      for (const item of typeof value === "string" ? [value] : (value ?? [])) {
        search.append(name, item);
      }
    }
    const qs = search.toString();
    return `${base}${path}${qs ? `?${qs}` : ""}`;
  }

  async function request(
    method: "GET" | "POST" | "DELETE",
    path: string,
    { query, body, signal, headers }: CloudSendOptions = {},
  ) {
    return fetchFn(url(path, query), {
      method,
      headers: {
        ...headers,
        ...(body !== undefined && { "Content-Type": "application/json" }),
        Authorization: authorization(),
      },
      ...(body !== undefined && { body: JSON.stringify(body) }),
      signal,
    });
  }

  async function send(method: "GET" | "POST" | "DELETE", path: string, options?: CloudSendOptions) {
    const response = await request(method, path, options);
    if (!response.ok) throw await apiError(response);
    const result = await readJson(response);
    if (!isRecord(result)) throw invalidResponse();
    return result;
  }

  /** POSTs JSON with `stream: true` and yields each event OpenUI Cloud sends, until `[DONE]`. */
  async function* stream(path: string, body: unknown, signal?: AbortSignal) {
    const response = await request("POST", path, {
      body: { ...(body as object), stream: true },
      signal,
      headers: { Accept: "text/event-stream" },
    });
    if (!response.ok) throw await apiError(response);
    if (!response.body) throw invalidResponse();
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
  }

  return {
    ...(options.appId !== undefined && { appId: options.appId }),
    request,
    send,
    stream,
  };
}

import { THESYS_API_BASE_URL } from "../shared/constants";
import { OpenUIApiError, type OpenUIClientOptions } from "./types";

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

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
  /** Sends a request and resolves with the JSON object OpenUI Cloud returns. */
  send(
    method: "GET" | "POST" | "DELETE",
    path: string,
    options?: CloudSendOptions,
  ): Promise<Record<string, unknown>>;
  /** POSTs JSON and resolves with the JSON object OpenUI Cloud returns. */
  post(
    path: string,
    body: unknown,
    signal?: AbortSignal,
    headers?: Record<string, string>,
  ): Promise<Record<string, unknown>>;
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

  async function send(
    method: "GET" | "POST" | "DELETE",
    path: string,
    { query, body, signal, headers }: CloudSendOptions = {},
  ) {
    const response = await fetchFn(url(path, query), {
      method,
      headers: {
        ...headers,
        ...(body !== undefined && { "Content-Type": "application/json" }),
        Authorization: authorization(),
      },
      ...(body !== undefined && { body: JSON.stringify(body) }),
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
  }

  return {
    ...(options.appId !== undefined && { appId: options.appId }),
    send,
    post: (path, body, signal, headers) => send("POST", path, { body, signal, headers }),
  };
}

import { THESYS_API_BASE_URL } from "../shared/constants";
import { OpenUIApiError, type OpenUIClientOptions } from "./types";

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

export interface CloudRequest {
  method?: "GET" | "POST";
  headers?: Record<string, string>;
  body?: string;
  signal?: AbortSignal;
}

/** Authenticated requests to OpenUI Cloud with the API key. */
export interface CloudApi {
  /** Sends a request with the API key and resolves with the response as is. */
  request(path: string, init?: CloudRequest): Promise<Response>;
  /** POSTs JSON and resolves with the JSON object OpenUI Cloud returns. */
  post(path: string, body: unknown, signal?: AbortSignal): Promise<Record<string, unknown>>;
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
  const base = (options.apiBaseUrl ?? THESYS_API_BASE_URL).replace(/\/+$/, "");
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
    request,

    async post(path, body, signal) {
      const response = await request(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
  };
}

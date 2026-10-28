import {
  ARTIFACT_ID_HEADER,
  FRONTEND_TOKEN_HEADER,
  THESYS_API_BASE_URL,
} from "../shared/constants";
import { OpenUIApiError, type OpenUIClientOptions } from "./types";

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

/** Authenticated requests to OpenUI Cloud with the API key. */
export interface CloudApi {
  post(path: string, body: unknown, signal?: AbortSignal): Promise<Record<string, unknown>>;
  stream(path: string, options: { lastEventId?: string; signal?: AbortSignal }): Promise<Response>;
  /**
   * Starts an artifact generation in the background, owned by the user the
   * frontend token is for. Resolves with the artifact's id as soon as it has one.
   */
  generate(
    body: unknown,
    options: { frontendToken: string; signal?: AbortSignal },
  ): Promise<string>;
}

async function apiError(response: Response): Promise<OpenUIApiError> {
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

  return {
    async post(path, body, signal) {
      const response = await fetchFn(`${base}${path}`, {
        method: "POST",
        headers: { Authorization: authorization(), "Content-Type": "application/json" },
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

    async stream(path, { lastEventId, signal }) {
      const headers: Record<string, string> = {
        Authorization: authorization(),
        Accept: "text/event-stream",
      };
      if (lastEventId) headers["Last-Event-ID"] = lastEventId;
      return fetchFn(`${base}${path}`, { headers, signal });
    },

    async generate(body, { frontendToken, signal }) {
      const response = await fetchFn(`${base}/v1/artifact/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: authorization(),
          "Content-Type": "application/json",
          [FRONTEND_TOKEN_HEADER]: frontendToken,
        },
        body: JSON.stringify(body),
        signal,
      });
      if (!response.ok) throw await apiError(response);
      const id = response.headers.get(ARTIFACT_ID_HEADER);
      // The generation carries on in OpenUI Cloud; renderers read it from there.
      await response.body?.cancel().catch(() => undefined);
      if (!id) {
        throw new OpenUIApiError(
          "OpenUI Cloud didn't start a background artifact",
          "invalid_response",
          502,
        );
      }
      return id;
    },
  };
}

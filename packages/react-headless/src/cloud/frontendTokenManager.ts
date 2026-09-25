/**
 * Frontend session-token (fct_) lifecycle for the browser plane.
 *
 * - The token rides ONLY the `x-thesys-frontend-token` header; `Authorization`
 *   on /v1/* always means the master key (server-side).
 * - Minting happens on YOUR backend (here, the /api/frontend-token proxy),
 *   which calls the cloud mint endpoint with the master key and decides the
 *   end-user identity server-side. The browser sends no body and never names
 *   its own user.
 * - Mint response: { token: 'fct_…', expires_at: <unix seconds> }, TTL ~15 min.
 *
 * A fetch override (not static headers) is used so the token can refresh
 * mid-session — the chat provider captures the storage object once at mount.
 */

export const FRONTEND_TOKEN_HEADER = "x-thesys-frontend-token";

export interface MintFrontendTokenResponse {
  token: string;
  expires_at: number; // unix seconds
}

export interface FrontendTokenManagerOptions {
  /** Your backend mint endpoint, e.g. "/api/frontend-token". */
  mintUrl: string;
  /** Override for tests / SSR. Defaults to globalThis.fetch. */
  fetch?: typeof fetch;
  /** Refresh this many seconds before expiry. Default 60. */
  refreshSkewSeconds?: number;
}

export interface FrontendTokenManager {
  /** A token valid for at least refreshSkewSeconds (single-flight mint). */
  getToken(): Promise<string>;
  /** Drop the cached token. Pass the token that 401'd so a concurrent refresh
   *  is not discarded. */
  invalidate(staleToken?: string): void;
}

export function createFrontendTokenManager({
  mintUrl,
  fetch: customFetch,
  refreshSkewSeconds = 60,
}: FrontendTokenManagerOptions): FrontendTokenManager {
  const fetchImpl = customFetch ?? globalThis.fetch.bind(globalThis);

  let token: string | null = null;
  let expiresAt = 0; // unix seconds
  let inflight: Promise<string> | null = null;

  const mint = async (): Promise<string> => {
    const res = await fetchImpl(mintUrl, { method: "POST" });
    if (!res.ok) {
      throw new Error(`frontend-token mint failed: ${res.status} ${res.statusText}`);
    }
    const body = (await res.json()) as MintFrontendTokenResponse;
    token = body.token;
    expiresAt = body.expires_at;
    return body.token;
  };

  return {
    async getToken(): Promise<string> {
      const nowSeconds = Date.now() / 1000;
      if (token !== null && nowSeconds < expiresAt - refreshSkewSeconds) return token;
      // Single-flight: callers during a refresh await the same mint.
      if (inflight === null) {
        inflight = mint().finally(() => {
          inflight = null;
        });
      }
      return inflight;
    },

    invalidate(staleToken?: string): void {
      if (staleToken === undefined || staleToken === token) {
        token = null;
        expiresAt = 0;
      }
    },
  };
}

/**
 * Wrap a base fetch so every request carries a fresh token, with one reactive
 * retry on 401. The request is re-sent with the same init — pass re-readable
 * (string) bodies only.
 */
export function createFctFetch(
  tokens: FrontendTokenManager,
  baseFetch?: typeof fetch,
): typeof fetch {
  const fetchImpl = baseFetch ?? globalThis.fetch.bind(globalThis);

  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const token = await tokens.getToken();
    const headers = new Headers(init?.headers);
    headers.set(FRONTEND_TOKEN_HEADER, token);

    let res = await fetchImpl(input, { ...init, headers });

    if (res.status === 401) {
      tokens.invalidate(token);
      const freshToken = await tokens.getToken();
      const retryHeaders = new Headers(init?.headers);
      retryHeaders.set(FRONTEND_TOKEN_HEADER, freshToken);
      res = await fetchImpl(input, { ...init, headers: retryHeaders });
    }

    return res;
  };
}

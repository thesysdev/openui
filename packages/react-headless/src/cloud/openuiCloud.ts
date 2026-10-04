"use client";

import { useMemo } from "react";
import type { ChatStorage } from "../adapters/types";

import { cloudArtifactStorage } from "./artifactStorage";
import {
  createFctFetch,
  createFrontendTokenManager,
  type FrontendTokenManager,
} from "./frontendTokenManager";
import { cloudThreadStorage } from "./threadStorage";

/** Which storage surfaces useOpenuiCloudStorage wires. */
export interface OpenuiCloudFeatures {
  /** Stored-artifact reads + edits. Default true. */
  artifact?: boolean;
}

export interface OpenuiCloudOptions {
  /**
   * The OpenUI Cloud API origin. Defaults to "https://api.thesys.dev" (the
   * storage layer appends `/v1/...`). Set this to e.g. "http://localhost:3102"
   * to run against a local stack. The browser calls this directly with the
   * fct_ token — there is no same-origin proxy in between.
   */
  apiBaseUrl?: string;
  /**
   * Where the short-lived fct_ session token comes from — either a URL of your
   * backend mint endpoint (POST → { token, expires_at }, cached + refreshed
   * here) or a function returning a fresh token (you own caching). The token
   * rides the `x-thesys-frontend-token` header on every /v1 call. The frontend
   * token is minted server-side; the master key never reaches the browser.
   */
  token: string | (() => Promise<string>);
  /** Which storage surfaces to wire. Omit to enable all. */
  features?: OpenuiCloudFeatures;
  /** fetch override (tests / SSR). Defaults to globalThis.fetch. */
  fetch?: typeof fetch;
  /** Refresh the cached token this many seconds before expiry (URL form). Default 60. */
  refreshSkewSeconds?: number;
}

/** OpenUI Cloud API origin used when `apiBaseUrl` is omitted. The storage
 *  layer appends `/v1/...` to it. */
const DEFAULT_API_BASE_URL = "https://api.thesys.dev";

/**
 * One-call browser wiring for OpenUI Cloud, as a hook: a memoised `ChatStorage`
 * backed by the /v1 API, authenticated per-request with an fct_ session token.
 * Pass it straight to `<AgentInterface storage={…} />`.
 *
 * As a hook the storage (and its fct_ token manager) is created on mount and
 * re-created only when its options change. Tokens are minted lazily on the first
 * storage request. ChatProvider captures storage at mount; remount the provider
 * when switching users or storage configurations.
 *
 * This is the READ/EDIT plane (browser → /v1/* with the fct_ token). Generation
 * is the separate ChatLLM plane (browser → your backend → /v1/embed/responses
 * with the master key).
 */
export function useOpenuiCloudStorage(options: OpenuiCloudOptions): ChatStorage {
  const { apiBaseUrl, token, fetch, refreshSkewSeconds } = options;
  const artifactOn = options.features?.artifact ?? true;
  return useMemo(
    () =>
      createCloudStorage({
        apiBaseUrl,
        token,
        fetch,
        refreshSkewSeconds,
        features: { artifact: artifactOn },
      }),
    [apiBaseUrl, token, fetch, refreshSkewSeconds, artifactOn],
  );
}

/** The actual storage wiring — a pure factory with no React, memoised by the
 *  hook above. */
function createCloudStorage(options: OpenuiCloudOptions): ChatStorage {
  const tokens = toTokenManager(options);
  const fctFetch = createFctFetch(tokens, options.fetch);
  const artifactOn = options.features?.artifact ?? true;
  const baseUrl = options.apiBaseUrl ?? DEFAULT_API_BASE_URL;

  const storage: ChatStorage = {
    thread: cloudThreadStorage({ baseUrl, fetch: fctFetch }),
  };
  if (artifactOn) {
    storage.artifact = cloudArtifactStorage({ baseUrl, fetch: fctFetch });
  }
  return storage;
}

/** Normalize the `token` option into a FrontendTokenManager. */
function toTokenManager(options: OpenuiCloudOptions): FrontendTokenManager {
  if (typeof options.token === "string") {
    return createFrontendTokenManager({
      mintUrl: options.token,
      fetch: options.fetch,
      refreshSkewSeconds: options.refreshSkewSeconds,
    });
  }
  const provider = options.token;
  let current: string | null = null;
  return {
    async getToken(): Promise<string> {
      current = await provider();
      return current;
    },
    invalidate(staleToken?: string): void {
      if (staleToken === undefined || staleToken === current) current = null;
    },
  };
}

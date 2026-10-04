import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createFctFetch,
  createFrontendTokenManager,
  FRONTEND_TOKEN_HEADER,
} from "../frontendTokenManager";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const mintResponse = (token: string) => json({ token, expires_at: Date.now() / 1000 + 900 });

afterEach(() => vi.useRealTimers());

describe("frontend tokens", () => {
  it("mints lazily, shares concurrent requests, and refreshes before expiry", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(json({ token: "first", expires_at: 900 }))
      .mockResolvedValueOnce(json({ token: "second", expires_at: 1800 }));
    const tokens = createFrontendTokenManager({ mintUrl: "/api/token", fetch });
    expect(fetch).not.toHaveBeenCalled();

    expect(await Promise.all([tokens.getToken(), tokens.getToken()])).toEqual(["first", "first"]);
    expect(fetch).toHaveBeenCalledExactlyOnceWith("/api/token", { method: "POST" });
    vi.setSystemTime(839_000);
    expect(await tokens.getToken()).toBe("first");
    expect(fetch).toHaveBeenCalledTimes(1);
    vi.setSystemTime(840_000);
    expect(await tokens.getToken()).toBe("second");
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("honors a custom refresh skew", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(json({ token: "first", expires_at: 900 }))
      .mockResolvedValueOnce(json({ token: "second", expires_at: 1800 }));
    const tokens = createFrontendTokenManager({
      mintUrl: "/api/token",
      fetch,
      refreshSkewSeconds: 120,
    });
    await tokens.getToken();
    vi.setSystemTime(780_000);
    expect(await tokens.getToken()).toBe("second");
  });

  it("keeps a refreshed token when an older concurrent request invalidates its token", async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(mintResponse("old"))
      .mockResolvedValueOnce(mintResponse("new"))
      .mockResolvedValueOnce(mintResponse("next"));
    const tokens = createFrontendTokenManager({ mintUrl: "/api/token", fetch });
    await tokens.getToken();
    tokens.invalidate("old");
    expect(await tokens.getToken()).toBe("new");
    tokens.invalidate("old");
    expect(await tokens.getToken()).toBe("new");
    expect(fetch).toHaveBeenCalledTimes(2);
    tokens.invalidate();
    expect(await tokens.getToken()).toBe("next");
  });

  it.each(["http", "network"] as const)(
    "allows another mint after a %s failure",
    async (failure) => {
      const fetch = vi.fn<typeof globalThis.fetch>();
      if (failure === "http") fetch.mockResolvedValueOnce(json({}, 503));
      else fetch.mockRejectedValueOnce(new Error("offline"));
      fetch.mockResolvedValueOnce(mintResponse("recovered"));
      const tokens = createFrontendTokenManager({ mintUrl: "/api/token", fetch });
      await expect(tokens.getToken()).rejects.toThrow(
        failure === "http" ? "frontend-token mint failed: 503" : "offline",
      );
      expect(await tokens.getToken()).toBe("recovered");
    },
  );
});

describe("authenticated fetch", () => {
  it("refreshes on 401 and retries once with the same request body and custom headers", async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(json({}, 401))
      .mockResolvedValueOnce(json({ ok: true }));
    const tokens = {
      getToken: vi.fn().mockResolvedValueOnce("old").mockResolvedValueOnce("new"),
      invalidate: vi.fn(),
    };
    const headers = new Headers({ "Content-Type": "application/json", "X-Custom": "kept" });
    const body = JSON.stringify({ title: "Hello" });
    const response = await createFctFetch(tokens, fetch)("/v1/conversations", {
      method: "POST",
      headers,
      body,
    });
    expect(response.status).toBe(200);
    expect(tokens.invalidate).toHaveBeenCalledWith("old");
    for (const [index, token] of ["old", "new"].entries()) {
      const [url, init] = fetch.mock.calls[index]!;
      expect(url).toBe("/v1/conversations");
      expect(init).toMatchObject({ method: "POST", body });
      const sentHeaders = new Headers(init?.headers);
      expect(sentHeaders.get(FRONTEND_TOKEN_HEADER)).toBe(token);
      expect(sentHeaders.get("Content-Type")).toBe("application/json");
      expect(sentHeaders.get("X-Custom")).toBe("kept");
      expect(sentHeaders.has("Authorization")).toBe(false);
    }
    expect(headers.has(FRONTEND_TOKEN_HEADER)).toBe(false);
  });

  it.each([401, 403, 500])("bounds retries for status %i", async (status) => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockImplementation(async () => json({}, status));
    const tokens = { getToken: vi.fn().mockResolvedValue("token"), invalidate: vi.fn() };
    const response = await createFctFetch(tokens, fetch)("/v1/conversations");
    expect(response.status).toBe(status);
    expect(fetch).toHaveBeenCalledTimes(status === 401 ? 2 : 1);
    expect(tokens.invalidate).toHaveBeenCalledTimes(status === 401 ? 1 : 0);
  });

  it("does not send a storage request when minting fails", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>();
    const tokens = {
      getToken: vi.fn().mockRejectedValue(new Error("mint failed")),
      invalidate: vi.fn(),
    };
    await expect(createFctFetch(tokens, fetch)("/v1/conversations")).rejects.toThrow("mint failed");
    expect(fetch).not.toHaveBeenCalled();
  });
});

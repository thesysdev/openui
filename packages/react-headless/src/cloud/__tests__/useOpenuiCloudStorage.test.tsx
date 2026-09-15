// @vitest-environment jsdom
import { act, StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useOpenuiCloudStorage, type ChatStorage, type OpenuiCloudOptions } from "../../index";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const emptyList = { data: [], has_more: false };

describe("useOpenuiCloudStorage", () => {
  let root: Root;
  let container: HTMLDivElement;
  let storage: ChatStorage;

  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  });

  function Harness({ options }: { options: OpenuiCloudOptions }) {
    storage = useOpenuiCloudStorage(options);
    return null;
  }

  async function render(options: OpenuiCloudOptions) {
    await act(async () => {
      root.render(
        <StrictMode>
          <Harness options={options} />
        </StrictMode>,
      );
    });
    return storage;
  }

  it("does no network work during render and shares a cached token across storage channels", async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockImplementation(async (input) =>
        json(
          input === "/api/token"
            ? { token: "session", expires_at: Date.now() / 1000 + 900 }
            : emptyList,
        ),
      );
    await render({ token: "/api/token", fetch });
    expect(fetch).not.toHaveBeenCalled();
    expect(storage.artifact).toBeDefined();
    await Promise.all([storage.thread.listThreads(), storage.artifact!.list()]);
    expect(fetch.mock.calls.map(([input]) => input)).toEqual([
      "/api/token",
      "https://api.thesys.dev/v1/conversations?limit=100",
      "https://api.thesys.dev/v1/artifacts?limit=100",
    ]);
    for (const [, init] of fetch.mock.calls.slice(1)) {
      expect(new Headers(init?.headers).get("x-thesys-frontend-token")).toBe("session");
    }
  });

  it("keeps storage and token cache stable when inline option objects are recreated", async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockImplementation(async (input) =>
        json(
          input === "/api/token"
            ? { token: "session", expires_at: Date.now() / 1000 + 900 }
            : emptyList,
        ),
      );
    const first = await render({ token: "/api/token", fetch });
    await first.thread.listThreads();
    const second = await render({ token: "/api/token", fetch, features: { artifact: true } });
    expect(second).toBe(first);
    await second.thread.listThreads();
    expect(fetch.mock.calls.filter(([input]) => input === "/api/token")).toHaveLength(1);
  });

  it.each([
    { token: "/api/another-user/token" },
    { apiBaseUrl: "https://cloud.example.com" },
    { refreshSkewSeconds: 120 },
    { features: { artifact: false } },
    { fetch: vi.fn<typeof globalThis.fetch>() },
  ] satisfies Partial<OpenuiCloudOptions>[])(
    "recreates storage when an option changes: %j",
    async (change) => {
      const fetch = vi.fn<typeof globalThis.fetch>();
      const first = await render({ token: "/api/token", fetch });
      const next = await render({ token: "/api/token", fetch, ...change });
      expect(next).not.toBe(first);
      expect(fetch).not.toHaveBeenCalled();
    },
  );

  it("uses the new mint endpoint after a token URL change", async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockImplementation(async (input) =>
        json(
          String(input).startsWith("/api/")
            ? { token: String(input), expires_at: Date.now() / 1000 + 900 }
            : emptyList,
        ),
      );
    await render({ token: "/api/alice/token", fetch });
    await storage.thread.listThreads();
    await render({ token: "/api/bob/token", fetch });
    await storage.thread.listThreads();
    expect(fetch.mock.calls[2]![0]).toBe("/api/bob/token");
    expect(new Headers(fetch.mock.calls[3]![1]?.headers).get("x-thesys-frontend-token")).toBe(
      "/api/bob/token",
    );
  });

  it("supports a token provider, custom origin, disabled artifacts, and a reactive retry", async () => {
    const token = vi.fn().mockResolvedValueOnce("expired").mockResolvedValueOnce("fresh");
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(json({}, 401))
      .mockResolvedValueOnce(json(emptyList));
    await render({
      token,
      fetch,
      apiBaseUrl: "https://cloud.example.com/",
      features: { artifact: false },
    });
    expect(storage.artifact).toBeUndefined();
    expect(token).not.toHaveBeenCalled();
    await storage.thread.listThreads();
    expect(token).toHaveBeenCalledTimes(2);
    expect(fetch.mock.calls.map(([input]) => input)).toEqual([
      "https://cloud.example.com/v1/conversations?limit=100",
      "https://cloud.example.com/v1/conversations?limit=100",
    ]);
    expect(new Headers(fetch.mock.calls[1]![1]?.headers).get("x-thesys-frontend-token")).toBe(
      "fresh",
    );
  });
});

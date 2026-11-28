import { afterEach, describe, expect, it, vi } from "vitest";
import { caught, fakeFetch, json } from "../__tests__/fake-fetch";
import { createCloudApi } from "./http";

afterEach(() => vi.unstubAllEnvs());

describe("CloudApi request and send", () => {
  it("adds the key, and JSON headers only with a body", async () => {
    const { fetch, requests } = fakeFetch();
    const api = createCloudApi({ apiKey: "k", baseUrl: "https://cloud.test/", fetch });
    await api.send("GET", "/v1/x");
    await api.send("POST", "/v1/x", { body: { a: 1 } });
    expect(requests.map(({ method, url, headers }) => [method, url.href, headers])).toEqual([
      ["GET", "https://cloud.test/v1/x", { Authorization: "Bearer k" }],
      [
        "POST",
        "https://cloud.test/v1/x",
        { Authorization: "Bearer k", "Content-Type": "application/json" },
      ],
    ]);
    expect(requests[1]!.body).toEqual({ a: 1 });
  });

  it("repeats array query values and leaves out undefined ones", async () => {
    const { fetch, requests } = fakeFetch();
    const api = createCloudApi({ apiKey: "k", fetch });
    await api.send("GET", "/v1/x", { query: { kind: ["a", "b"], name: undefined, limit: "5" } });
    expect(requests[0]!.url.search).toBe("?kind=a&kind=b&limit=5");
  });

  it("falls back to THESYS_API_KEY, and fails before any request without a key", async () => {
    const { fetch, requests } = fakeFetch();
    vi.stubEnv("THESYS_API_KEY", "env-key");
    await createCloudApi({ fetch }).send("GET", "/v1/x");
    expect(requests[0]!.headers["Authorization"]).toBe("Bearer env-key");

    vi.stubEnv("THESYS_API_KEY", "");
    expect(await caught(() => createCloudApi({ fetch }).send("GET", "/v1/x"))).toMatchObject({
      name: "OpenUIApiError",
      code: "missing_api_key",
    });
    expect(requests).toHaveLength(1);
  });

  it.each([
    [{ error: { message: "Not yours", code: "not_found" } }, "Not yours", "not_found"],
    [{ message: "Slow down" }, "Slow down", "http_error"],
    ["<html>", "OpenUI Cloud request failed: HTTP 404", "http_error"],
  ])("reads the error from %j", async (body, message, code) => {
    const { fetch } = fakeFetch(() =>
      typeof body === "string" ? new Response(body, { status: 404 }) : json(body, 404),
    );
    const api = createCloudApi({ apiKey: "k", fetch });
    expect(await caught(() => api.send("GET", "/v1/x"))).toMatchObject({
      name: "OpenUIApiError",
      message,
      code,
      status: 404,
    });
  });

  it("rejects a reply that isn't a JSON object", async () => {
    const { fetch } = fakeFetch(() => json([1, 2]));
    const api = createCloudApi({ apiKey: "k", fetch });
    expect(await caught(() => api.send("GET", "/v1/x"))).toMatchObject({
      code: "invalid_response",
      status: 502,
    });
  });

  it("returns the raw response from request, whatever its status", async () => {
    const { fetch } = fakeFetch(() => json({ nope: true }, 500));
    const response = await createCloudApi({ apiKey: "k", fetch }).request("POST", "/v1/x");
    expect(response.status).toBe(500);
  });

  it.each(["", " ", 5])("rejects the appId %j", (appId) => {
    expect(() => createCloudApi({ appId: appId as string })).toThrow(
      "appId must be a non-empty string",
    );
  });
});

/** A fetch that answers with these SSE pieces, cut wherever the test says. */
const sse = (pieces: string[]) => async () =>
  new Response(
    new ReadableStream({
      start(controller) {
        for (const piece of pieces) controller.enqueue(new TextEncoder().encode(piece));
        controller.close();
      },
    }),
    { headers: { "Content-Type": "text/event-stream" } },
  );

describe("CloudApi stream", () => {
  it("yields each data event, across cut lines, until [DONE]", async () => {
    const api = createCloudApi({
      apiKey: "k",
      fetch: sse([
        'data: {"a":1}\n\nda',
        'ta: {"a":2}\n\n',
        "data: [DONE]\n\n",
        'data: {"a":3}\n\n',
      ]),
    });
    const events: unknown[] = [];
    for await (const event of api.stream("/x", {})) events.push(event);
    expect(events).toEqual([{ a: 1 }, { a: 2 }]);
  });
});

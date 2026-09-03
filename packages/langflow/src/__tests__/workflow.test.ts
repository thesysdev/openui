import { describe, expect, it, vi } from "vitest";

import { LangflowRequestError, streamLangflowWorkflow } from "../workflow";

describe("streamLangflowWorkflow", () => {
  it("calls Workflow API v2 with native AG-UI streaming", async () => {
    const nativeStream = 'id: 0\ndata: {"type":"RUN_STARTED","threadId":"thread-1"}\n\n';
    const abortController = new AbortController();
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        new Response(nativeStream, { headers: { "Content-Type": "text/event-stream" } }),
      );

    const response = await streamLangflowWorkflow({
      apiUrl: "http://localhost:7860/",
      apiKey: "server-only-key",
      flowId: "flow-1",
      inputValue: "Show a chart",
      sessionId: "thread-1",
      tweaks: { Agent: { model_name: "gpt-5.5" } },
      signal: abortController.signal,
      fetch: fetchMock,
    });

    expect(await response.text()).toBe(nativeStream);
    expect(fetchMock).toHaveBeenCalledOnce();

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("http://localhost:7860/api/v2/workflows");
    expect(init?.signal).toBe(abortController.signal);
    expect(new Headers(init?.headers).get("x-api-key")).toBe("server-only-key");
    expect(JSON.parse(String(init?.body))).toEqual({
      flow_id: "flow-1",
      input_value: "Show a chart",
      session_id: "thread-1",
      mode: "stream",
      stream_protocol: "agui",
      tweaks: { Agent: { model_name: "gpt-5.5" } },
    });
  });

  it("redacts upstream error bodies unless debug is enabled", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(Response.json({ detail: "internal deployment detail" }, { status: 422 }));

    const regularError = await captureError(
      streamLangflowWorkflow({
        apiUrl: "http://localhost:7860",
        flowId: "flow-1",
        inputValue: "Hello",
        sessionId: "thread-1",
        fetch: fetchMock,
      }),
    );
    expect(regularError).toBeInstanceOf(LangflowRequestError);
    expect((regularError as LangflowRequestError).detail).toBeUndefined();

    const debugError = await captureError(
      streamLangflowWorkflow({
        apiUrl: "http://localhost:7860",
        flowId: "flow-1",
        inputValue: "Hello",
        sessionId: "thread-1",
        debug: true,
        fetch: fetchMock,
      }),
    );
    expect((debugError as LangflowRequestError).detail).toContain("internal deployment detail");
  });
});

async function captureError(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error("Expected promise to reject");
}

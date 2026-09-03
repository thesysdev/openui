import { describe, expect, it, vi } from "vitest";

import { createLangflowStreamResponse } from "../request-handler";

describe("createLangflowStreamResponse", () => {
  it("maps an OpenUI thread and latest action turn to Langflow", async () => {
    const nativeStream = [
      'data: {"type":"RUN_STARTED","threadId":"thread-7","runId":"run-1"}',
      'data: {"type":"TEXT_MESSAGE_START","messageId":"message-1","role":"assistant"}',
      'data: {"type":"TEXT_MESSAGE_CONTENT","messageId":"message-1","delta":"root = Card([])"}',
      'data: {"type":"TEXT_MESSAGE_END","messageId":"message-1"}',
      'data: {"type":"RUN_FINISHED","threadId":"thread-7","runId":"run-1"}',
      "",
    ].join("\n\n");
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        new Response(nativeStream, { headers: { "Content-Type": "text/event-stream" } }),
      );
    const request = chatRequest({
      threadId: "thread-7",
      messages: [
        { id: "user-1", role: "user", content: "Build an intake form" },
        { id: "assistant-1", role: "assistant", content: "root = Card([])" },
        {
          id: "user-2",
          role: "user",
          content:
            ']]\u003eopenui:content\nSubmit project\n]]\u003eopenui:context\n["User clicked: Submit project",{"project":"Aurora-731","teamSize":7}]',
        },
      ],
    });

    const response = await createLangflowStreamResponse(request, {
      apiUrl: "http://localhost:7860",
      apiKey: "secret",
      flowId: "flow-1",
      fetch: fetchMock,
    });

    expect(response.status).toBe(200);
    expect(await response.text()).toBe(nativeStream);
    const payload = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(payload.session_id).toBe("thread-7");
    expect(payload.stream_protocol).toBe("agui");
    expect(payload.input_value).toContain("Aurora-731");
    expect(payload.input_value).not.toContain("Build an intake form");
  });

  it("supports application-specific input preparation", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response("data: {}\n\n"));
    const request = chatRequest({
      threadId: "thread-1",
      tenant: "acme",
      messages: [{ id: "user-1", role: "user", content: "Hello" }],
    });

    await createLangflowStreamResponse(request, {
      apiUrl: "http://localhost:7860",
      flowId: "flow-1",
      fetch: fetchMock,
      prepareSessionId: ({ threadId }) => `tenant-acme:${threadId}`,
      prepareInput: ({ inputValue, requestBody }) =>
        `[tenant=${String(requestBody.tenant)}] ${inputValue}`,
    });

    const payload = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(payload.input_value).toBe("[tenant=acme] Hello");
    expect(payload.session_id).toBe("tenant-acme:thread-1");
  });

  it("returns 400 for malformed chat requests", async () => {
    const response = await createLangflowStreamResponse(chatRequest({ messages: [] }), {
      apiUrl: "http://localhost:7860",
      flowId: "flow-1",
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Expected a JSON request body containing a non-empty messages array",
    });
  });

  it("returns a sanitized 502 when Langflow rejects the run", async () => {
    const response = await createLangflowStreamResponse(
      chatRequest({ messages: [{ id: "user-1", role: "user", content: "Hello" }] }),
      {
        apiUrl: "http://localhost:7860",
        flowId: "flow-1",
        fetch: vi
          .fn<typeof fetch>()
          .mockResolvedValue(
            Response.json({ detail: "sensitive upstream detail" }, { status: 401 }),
          ),
      },
    );

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      error: "Langflow workflow request failed with HTTP 401",
    });
  });
});

function chatRequest(body: Record<string, unknown>): Request {
  return new Request("http://localhost/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

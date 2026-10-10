import { describe, expect, it, vi } from "vitest";
import { EventType } from "../../../types";
import { agUIAdapter } from "../ag-ui";
import { openAIAdapter } from "../openai-completions";
import { openAIReadableStreamAdapter } from "../openai-readable-stream";
import { openAIResponsesAdapter } from "../openai-responses";
import { collect, completionChunk, makeResponse, ndjson, sse } from "./streamTestHelpers";

const chunk = completionChunk;

// Frames captured from the OpenUI Gateway (dev) on 2026-09-30, all under HTTP 200.
const configError = {
  error: {
    message:
      "Managed openui config keys 'libraryVersion' and 'chatLibrary' are mutually exclusive — a custom chatLibrary replaces the built-in chat library.",
    type: "invalid_request_error",
    code: "400",
  },
};
const providerError = {
  error: {
    message: "The model provider failed to serve this request.",
    type: "invalid_request_error",
    code: "500",
  },
};
const postStreamError = {
  error: { message: "Internal server error", type: "internal_server_error", code: "500" },
};

describe("in-stream error frames → RUN_ERROR", () => {
  describe.each([
    { name: "openAIAdapter", make: openAIAdapter, frame: sse },
    { name: "openAIReadableStreamAdapter", make: openAIReadableStreamAdapter, frame: ndjson },
  ])("$name", ({ make, frame }) => {
    it("surfaces an error frame that is the only record (request rejected in-stream)", async () => {
      const events = await collect(make().parse(makeResponse(frame(configError))));
      expect(events).toEqual([
        { type: EventType.RUN_ERROR, message: configError.error.message, code: "400" },
      ]);
    });

    it("surfaces an error frame that follows role/empty deltas (provider failure)", async () => {
      const body = frame(chunk({ role: "assistant" })) + frame(chunk({})) + frame(providerError);
      const events = await collect(make().parse(makeResponse(body)));
      expect(events.map((e) => e.type)).toEqual([
        EventType.TEXT_MESSAGE_START,
        EventType.RUN_ERROR,
      ]);
      expect(events[1]).toMatchObject({ message: providerError.error.message, code: "500" });
    });

    it("surfaces an error frame that arrives after a finished answer (post-stream failure)", async () => {
      const body =
        frame(chunk({ role: "assistant", content: "answer" })) +
        frame(chunk({}, "stop")) +
        frame(postStreamError);
      const events = await collect(make().parse(makeResponse(body)));
      expect(events.map((e) => e.type)).toEqual([
        EventType.TEXT_MESSAGE_START,
        EventType.TEXT_MESSAGE_CONTENT,
        EventType.TEXT_MESSAGE_END,
        EventType.RUN_ERROR,
      ]);
    });

    it("keeps parsing normal chunks unchanged", async () => {
      const body = frame(chunk({ role: "assistant", content: "hi" })) + frame(chunk({}, "stop"));
      const events = await collect(make().parse(makeResponse(body)));
      expect(events.map((e) => e.type)).toEqual([
        EventType.TEXT_MESSAGE_START,
        EventType.TEXT_MESSAGE_CONTENT,
        EventType.TEXT_MESSAGE_END,
      ]);
    });

    it("tolerates a string error and a numeric code, and falls back to a generic message", async () => {
      expect(await collect(make().parse(makeResponse(frame({ error: "rate limited" }))))).toEqual([
        { type: EventType.RUN_ERROR, message: "rate limited" },
      ]);
      expect(await collect(make().parse(makeResponse(frame({ error: { code: 429 } }))))).toEqual([
        { type: EventType.RUN_ERROR, message: "Stream error", code: "429" },
      ]);
    });

    it("stops at the first error record: a RUN_ERROR is terminal", async () => {
      const body =
        frame(chunk({ role: "assistant", content: "partial" })) +
        frame(providerError) +
        frame(chunk({ content: "after" }, "stop"));
      const events = await collect(make().parse(makeResponse(body)));
      expect(events.map((e) => e.type)).toEqual([
        EventType.TEXT_MESSAGE_START,
        EventType.TEXT_MESSAGE_CONTENT,
        EventType.RUN_ERROR,
      ]);
    });
  });

  describe("agUIAdapter", () => {
    it("surfaces an untyped error record as RUN_ERROR", async () => {
      const events = await collect(agUIAdapter().parse(makeResponse(sse(providerError))));
      expect(events).toEqual([
        { type: EventType.RUN_ERROR, message: providerError.error.message, code: "500" },
      ]);
    });

    it("does not touch a typed AG-UI event that carries an `error` field (tool result failures)", async () => {
      const toolResult = {
        type: EventType.TOOL_CALL_RESULT,
        messageId: "m1",
        toolCallId: "c1",
        content: "boom",
        isError: true,
        error: "boom",
      };
      const events = await collect(agUIAdapter().parse(makeResponse(sse(toolResult))));
      expect(events).toEqual([toolResult]);
    });

    it("skips (and logs) an untyped record that is not an error", async () => {
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});
      try {
        const events = await collect(agUIAdapter().parse(makeResponse(sse({ hello: "world" }))));
        expect(events).toEqual([]);
        expect(spy).toHaveBeenCalledTimes(1);
      } finally {
        spy.mockRestore();
      }
    });
  });

  describe("openAIResponsesAdapter", () => {
    it("surfaces an untyped error record as RUN_ERROR", async () => {
      const events = await collect(
        openAIResponsesAdapter().parse(makeResponse(sse(providerError))),
      );
      expect(events).toEqual([
        { type: EventType.RUN_ERROR, message: providerError.error.message, code: "500" },
      ]);
    });

    it("still maps the typed `error` event", async () => {
      const typed = {
        type: "error",
        code: "400",
        message: "bad request",
        param: null,
        sequence_number: 2,
      };
      const events = await collect(openAIResponsesAdapter().parse(makeResponse(sse(typed))));
      expect(events).toEqual([{ type: EventType.RUN_ERROR, message: "bad request", code: "400" }]);
    });
  });
});

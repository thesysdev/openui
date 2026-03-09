import type { AssistantModelMessage, ModelMessage, ToolModelMessage, UserModelMessage } from "ai";
import { describe, expect, it } from "vitest";
import type {
  AssistantMessage,
  Message,
  SystemMessage,
  ToolMessage,
  UserMessage,
} from "../../../types";
import { vercelAIMessageFormat } from "../vercel-ai-message-format";

const { toApi, fromApi } = vercelAIMessageFormat;

// ── toApi ────────────────────────────────────────────────────────

describe("vercelAIMessageFormat", () => {
  describe("toApi", () => {
    it("converts a text user message", () => {
      const messages: Message[] = [{ id: "u1", role: "user", content: "Hello" }];

      const result = toApi(messages) as ModelMessage[];

      expect(result).toEqual([{ role: "user", content: "Hello" }]);
    });

    it("converts a text assistant message", () => {
      const messages: Message[] = [{ id: "a1", role: "assistant", content: "Hi there" }];

      const result = toApi(messages) as ModelMessage[];

      expect(result).toEqual([
        { role: "assistant", content: [{ type: "text", text: "Hi there" }] },
      ]);
    });

    it("converts a system message", () => {
      const messages: Message[] = [{ id: "s1", role: "system", content: "You are helpful" }];

      const result = toApi(messages) as ModelMessage[];

      expect(result).toEqual([{ role: "system", content: "You are helpful" }]);
    });

    it("converts a developer message to system role", () => {
      const messages: Message[] = [{ id: "d1", role: "developer", content: "Be concise" }];

      const result = toApi(messages) as ModelMessage[];

      expect(result).toEqual([{ role: "system", content: "Be concise" }]);
    });

    it("converts assistant message with tool calls", () => {
      const messages: Message[] = [
        {
          id: "a1",
          role: "assistant",
          content: "Let me check",
          toolCalls: [
            {
              id: "tc1",
              type: "function",
              function: {
                name: "get_weather",
                arguments: '{"city":"SF"}',
              },
            },
          ],
        } as AssistantMessage,
      ];

      const result = toApi(messages) as ModelMessage[];

      expect(result).toEqual([
        {
          role: "assistant",
          content: [
            { type: "text", text: "Let me check" },
            {
              type: "tool-call",
              toolCallId: "tc1",
              toolName: "get_weather",
              input: { city: "SF" },
            },
          ],
        },
      ]);
    });

    it("falls back to empty input when tool call arguments are malformed JSON", () => {
      const messages: Message[] = [
        {
          id: "a1",
          role: "assistant",
          toolCalls: [
            {
              id: "tc1",
              type: "function",
              function: { name: "broken", arguments: "{not valid json" },
            },
          ],
        } as AssistantMessage,
      ];

      const result = toApi(messages) as AssistantModelMessage[];

      expect(result).toHaveLength(1);
      expect(result[0]!.content).toEqual([
        {
          type: "tool-call",
          toolCallId: "tc1",
          toolName: "broken",
          input: {},
        },
      ]);
    });

    it("converts assistant message with only tool calls (no text)", () => {
      const messages: Message[] = [
        {
          id: "a1",
          role: "assistant",
          toolCalls: [
            {
              id: "tc1",
              type: "function",
              function: { name: "search", arguments: '{"q":"test"}' },
            },
          ],
        } as AssistantMessage,
      ];

      const result = toApi(messages) as AssistantModelMessage[];

      expect(result).toHaveLength(1);
      expect(result[0]!.content).toEqual([
        {
          type: "tool-call",
          toolCallId: "tc1",
          toolName: "search",
          input: { q: "test" },
        },
      ]);
    });

    it("groups consecutive tool messages into a single ToolModelMessage", () => {
      const messages: Message[] = [
        {
          id: "t1",
          role: "tool",
          content: '{"temp":72}',
          toolCallId: "tc1",
        } as ToolMessage,
        {
          id: "t2",
          role: "tool",
          content: '{"result":4}',
          toolCallId: "tc2",
        } as ToolMessage,
      ];

      const result = toApi(messages) as ToolModelMessage[];

      expect(result).toHaveLength(1);
      expect(result[0]!.role).toBe("tool");
      expect(result[0]!.content).toEqual([
        {
          type: "tool-result",
          toolCallId: "tc1",
          toolName: "",
          output: { type: "json", value: { temp: 72 } },
        },
        {
          type: "tool-result",
          toolCallId: "tc2",
          toolName: "",
          output: { type: "json", value: { result: 4 } },
        },
      ]);
    });

    it("uses text output for non-JSON tool content", () => {
      const messages: Message[] = [
        {
          id: "t1",
          role: "tool",
          content: "plain text result",
          toolCallId: "tc1",
        } as ToolMessage,
      ];

      const result = toApi(messages) as ToolModelMessage[];

      expect(result[0]!.content[0]).toEqual(
        expect.objectContaining({
          type: "tool-result",
          output: { type: "text", value: "plain text result" },
        }),
      );
    });

    it("handles non-consecutive tool messages as separate groups", () => {
      const messages: Message[] = [
        { id: "t1", role: "tool", content: '"a"', toolCallId: "tc1" } as ToolMessage,
        { id: "a1", role: "assistant", content: "middle" } as AssistantMessage,
        { id: "t2", role: "tool", content: '"b"', toolCallId: "tc2" } as ToolMessage,
      ];

      const result = toApi(messages) as ModelMessage[];

      expect(result).toHaveLength(3);
      expect(result[0]!.role).toBe("tool");
      expect(result[1]!.role).toBe("assistant");
      expect(result[2]!.role).toBe("tool");
    });

    it("converts multipart user content with text and binary", () => {
      const messages: Message[] = [
        {
          id: "u1",
          role: "user",
          content: [
            { type: "text", text: "Describe this" },
            {
              type: "binary",
              mimeType: "image/png",
              url: "https://example.com/img.png",
            },
          ],
        } as UserMessage,
      ];

      const result = toApi(messages) as UserModelMessage[];

      expect(result[0]!.content).toEqual([
        { type: "text", text: "Describe this" },
        {
          type: "file",
          data: new URL("https://example.com/img.png"),
          mediaType: "image/png",
        },
      ]);
    });

    it("builds data URI for binary content with base64 data", () => {
      const messages: Message[] = [
        {
          id: "u1",
          role: "user",
          content: [
            {
              type: "binary",
              mimeType: "image/jpeg",
              data: "abc123",
            },
          ],
        } as UserMessage,
      ];

      const result = toApi(messages) as UserModelMessage[];
      const part = (result[0]!.content as Array<{ type: string }>)[0];

      expect(part).toEqual({
        type: "file",
        data: new URL("data:image/jpeg;base64,abc123"),
        mediaType: "image/jpeg",
      });
    });

    it("converts assistant message with empty content to empty string", () => {
      const messages: Message[] = [{ id: "a1", role: "assistant" } as AssistantMessage];

      const result = toApi(messages) as AssistantModelMessage[];

      expect(result[0]!.content).toBe("");
    });

    it("skips unknown roles like activity and reasoning", () => {
      const messages: Message[] = [
        { id: "act1", role: "activity", activityType: "search", content: {} } as unknown as Message,
        { id: "r1", role: "reasoning", content: "thinking..." } as unknown as Message,
        { id: "u1", role: "user", content: "Hello" } as UserMessage,
      ];

      const result = toApi(messages) as ModelMessage[];

      expect(result).toHaveLength(1);
      expect(result[0]!.role).toBe("user");
    });
  });

  // ── fromApi ──────────────────────────────────────────────────────

  describe("fromApi", () => {
    it("converts a text user message", () => {
      const data: ModelMessage[] = [{ role: "user", content: "Hello" }];

      const result = fromApi(data);

      expect(result).toHaveLength(1);
      expect(result[0]!.role).toBe("user");
      expect((result[0] as UserMessage).content).toBe("Hello");
      expect(result[0]!.id).toBeTruthy();
    });

    it("converts a text assistant message (string content)", () => {
      const data: ModelMessage[] = [{ role: "assistant", content: "Hi there" }];

      const result = fromApi(data);

      expect(result).toHaveLength(1);
      expect(result[0]!.role).toBe("assistant");
      expect((result[0] as AssistantMessage).content).toBe("Hi there");
    });

    it("converts a system message", () => {
      const data: ModelMessage[] = [{ role: "system", content: "You are helpful" }];

      const result = fromApi(data);

      expect(result).toHaveLength(1);
      expect(result[0]!.role).toBe("system");
      expect((result[0] as SystemMessage).content).toBe("You are helpful");
    });

    it("converts assistant message with tool call parts", () => {
      const data: ModelMessage[] = [
        {
          role: "assistant",
          content: [
            { type: "text", text: "Checking..." },
            {
              type: "tool-call",
              toolCallId: "tc1",
              toolName: "get_weather",
              input: { city: "NYC" },
            },
          ],
        },
      ];

      const result = fromApi(data);
      const msg = result[0] as AssistantMessage;

      expect(msg.role).toBe("assistant");
      expect(msg.content).toBe("Checking...");
      expect(msg.toolCalls).toEqual([
        {
          id: "tc1",
          type: "function",
          function: {
            name: "get_weather",
            arguments: '{"city":"NYC"}',
          },
        },
      ]);
    });

    it("converts assistant with only tool calls (no text)", () => {
      const data: ModelMessage[] = [
        {
          role: "assistant",
          content: [
            {
              type: "tool-call",
              toolCallId: "tc1",
              toolName: "search",
              input: { q: "test" },
            },
          ],
        },
      ];

      const result = fromApi(data);
      const msg = result[0] as AssistantMessage;

      expect(msg.content).toBeUndefined();
      expect(msg.toolCalls).toHaveLength(1);
    });

    it("expands ToolModelMessage into multiple AG-UI ToolMessages", () => {
      const data: ModelMessage[] = [
        {
          role: "tool",
          content: [
            {
              type: "tool-result",
              toolCallId: "tc1",
              toolName: "get_weather",
              output: { type: "json", value: { temp: 72 } },
            },
            {
              type: "tool-result",
              toolCallId: "tc2",
              toolName: "calculator",
              output: { type: "text", value: "4" },
            },
          ],
        },
      ];

      const result = fromApi(data);

      expect(result).toHaveLength(2);

      const t1 = result[0] as ToolMessage;
      expect(t1.role).toBe("tool");
      expect(t1.toolCallId).toBe("tc1");
      expect(t1.content).toBe('{"temp":72}');

      const t2 = result[1] as ToolMessage;
      expect(t2.role).toBe("tool");
      expect(t2.toolCallId).toBe("tc2");
      expect(t2.content).toBe("4");
    });

    it("handles error-text ToolResultOutput", () => {
      const data: ModelMessage[] = [
        {
          role: "tool",
          content: [
            {
              type: "tool-result",
              toolCallId: "tc1",
              toolName: "failing_tool",
              output: { type: "error-text", value: "Something went wrong" },
            },
          ],
        } as ToolModelMessage,
      ];

      const result = fromApi(data);

      expect(result).toHaveLength(1);
      expect((result[0]! as ToolMessage).content).toBe("Something went wrong");
    });

    it("handles error-json ToolResultOutput", () => {
      const data: ModelMessage[] = [
        {
          role: "tool",
          content: [
            {
              type: "tool-result",
              toolCallId: "tc1",
              toolName: "failing_tool",
              output: { type: "error-json", value: { code: 500, msg: "fail" } },
            },
          ],
        } as ToolModelMessage,
      ];

      const result = fromApi(data);

      expect(result).toHaveLength(1);
      expect((result[0]! as ToolMessage).content).toBe('{"code":500,"msg":"fail"}');
    });

    it("handles execution-denied ToolResultOutput with reason", () => {
      const data: ModelMessage[] = [
        {
          role: "tool",
          content: [
            {
              type: "tool-result",
              toolCallId: "tc1",
              toolName: "dangerous_tool",
              output: { type: "execution-denied", reason: "User declined" },
            },
          ],
        } as ToolModelMessage,
      ];

      const result = fromApi(data);

      expect(result).toHaveLength(1);
      expect((result[0]! as ToolMessage).content).toBe("User declined");
    });

    it("handles execution-denied ToolResultOutput without reason", () => {
      const data: ModelMessage[] = [
        {
          role: "tool",
          content: [
            {
              type: "tool-result",
              toolCallId: "tc1",
              toolName: "dangerous_tool",
              output: { type: "execution-denied" },
            },
          ],
        } as ToolModelMessage,
      ];

      const result = fromApi(data);

      expect(result).toHaveLength(1);
      expect((result[0]! as ToolMessage).content).toBe("Tool execution denied");
    });

    it("converts multipart user content with text and file parts", () => {
      const data: ModelMessage[] = [
        {
          role: "user",
          content: [
            { type: "text", text: "Describe this" },
            {
              type: "file",
              data: new URL("https://example.com/img.png"),
              mediaType: "image/png",
            },
          ],
        },
      ];

      const result = fromApi(data);
      const msg = result[0] as UserMessage;

      expect(Array.isArray(msg.content)).toBe(true);
      const parts = msg.content as Array<{ type: string }>;
      expect(parts[0]).toEqual({ type: "text", text: "Describe this" });
      expect(parts[1]).toEqual({
        type: "binary",
        mimeType: "image/png",
        url: "https://example.com/img.png",
      });
    });

    it("converts multipart user content with image parts", () => {
      const data: ModelMessage[] = [
        {
          role: "user",
          content: [
            {
              type: "image",
              image: new URL("https://example.com/photo.jpg"),
              mediaType: "image/jpeg",
            },
          ],
        },
      ];

      const result = fromApi(data);
      const msg = result[0] as UserMessage;
      const parts = msg.content as Array<{ type: string; mimeType: string; url: string }>;

      expect(parts[0]).toEqual({
        type: "binary",
        mimeType: "image/jpeg",
        url: "https://example.com/photo.jpg",
      });
    });

    it("generates unique IDs for each message", () => {
      const data: ModelMessage[] = [
        { role: "user", content: "a" },
        { role: "user", content: "b" },
      ];

      const result = fromApi(data);

      expect(result[0]!.id).toBeTruthy();
      expect(result[1]!.id).toBeTruthy();
      expect(result[0]!.id).not.toBe(result[1]!.id);
    });
  });

  // ── Round-trip ───────────────────────────────────────────────────

  describe("round-trip", () => {
    it("preserves text messages through toApi → fromApi", () => {
      const original: Message[] = [
        { id: "u1", role: "user", content: "Hello" },
        { id: "a1", role: "assistant", content: "Hi there" },
        { id: "s1", role: "system", content: "Be helpful" },
      ];

      const roundTripped = fromApi(toApi(original));

      expect(roundTripped).toHaveLength(3);
      expect((roundTripped[0] as UserMessage).content).toBe("Hello");
      expect((roundTripped[1] as AssistantMessage).content).toBe("Hi there");
      expect((roundTripped[2] as SystemMessage).content).toBe("Be helpful");
    });

    it("preserves tool calls through toApi → fromApi", () => {
      const original: Message[] = [
        {
          id: "a1",
          role: "assistant",
          content: "Checking",
          toolCalls: [
            {
              id: "tc1",
              type: "function",
              function: { name: "search", arguments: '{"q":"weather"}' },
            },
          ],
        } as AssistantMessage,
      ];

      const roundTripped = fromApi(toApi(original));
      const msg = roundTripped[0] as AssistantMessage;

      expect(msg.content).toBe("Checking");
      expect(msg.toolCalls).toEqual([
        {
          id: "tc1",
          type: "function",
          function: { name: "search", arguments: '{"q":"weather"}' },
        },
      ]);
    });

    it("preserves tool results through toApi → fromApi", () => {
      const original: Message[] = [
        {
          id: "t1",
          role: "tool",
          content: '{"temp":72}',
          toolCallId: "tc1",
        } as ToolMessage,
        {
          id: "t2",
          role: "tool",
          content: '{"result":4}',
          toolCallId: "tc2",
        } as ToolMessage,
      ];

      const roundTripped = fromApi(toApi(original));

      expect(roundTripped).toHaveLength(2);
      expect((roundTripped[0] as ToolMessage).toolCallId).toBe("tc1");
      expect((roundTripped[0] as ToolMessage).content).toBe('{"temp":72}');
      expect((roundTripped[1] as ToolMessage).toolCallId).toBe("tc2");
      expect((roundTripped[1] as ToolMessage).content).toBe('{"result":4}');
    });

    it("preserves a full conversation through toApi → fromApi", () => {
      const original: Message[] = [
        { id: "s1", role: "system", content: "You are helpful" } as SystemMessage,
        { id: "u1", role: "user", content: "What's the weather?" } as UserMessage,
        {
          id: "a1",
          role: "assistant",
          content: "Let me check",
          toolCalls: [
            {
              id: "tc1",
              type: "function",
              function: { name: "get_weather", arguments: '{"city":"SF"}' },
            },
          ],
        } as AssistantMessage,
        {
          id: "t1",
          role: "tool",
          content: '{"temp":65}',
          toolCallId: "tc1",
        } as ToolMessage,
        {
          id: "a2",
          role: "assistant",
          content: "It's 65°F in SF",
        } as AssistantMessage,
      ];

      const roundTripped = fromApi(toApi(original));

      expect(roundTripped).toHaveLength(5);
      expect(roundTripped.map((m) => m.role)).toEqual([
        "system",
        "user",
        "assistant",
        "tool",
        "assistant",
      ]);

      const assistant1 = roundTripped[2] as AssistantMessage;
      expect(assistant1.toolCalls?.[0]!.function.name).toBe("get_weather");

      const tool1 = roundTripped[3] as ToolMessage;
      expect(tool1.toolCallId).toBe("tc1");
      expect(tool1.content).toBe('{"temp":65}');
    });
  });
});

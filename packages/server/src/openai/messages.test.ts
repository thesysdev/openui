import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { describe, expect, it } from "vitest";
import type { ConversationItem } from "../conversations/types";
import { chatCompletionsConverter } from "./messages";

/** Items as OpenUI Cloud returns them: with an id. */
const stored = (items: object[]) =>
  items.map((item, i) => ({
    id: `item_${i}`,
    object: "conversation.item",
    conversation_id: "conv_1",
    ...item,
  })) as ConversationItem[];

describe("chatCompletionsConverter.fromItems", () => {
  it("rebuilds a turn: a reply's text and its tool calls are one assistant message", () => {
    expect(
      chatCompletionsConverter.fromItems(
        stored([
          { type: "message", role: "user", content: [{ type: "input_text", text: "Weather?" }] },
          {
            type: "message",
            role: "assistant",
            content: [{ type: "output_text", text: "Checking." }],
          },
          { type: "function_call", call_id: "c1", name: "weather", arguments: '{"city":"Paris"}' },
          { type: "function_call_output", call_id: "c1", output: "18C" },
          { type: "message", role: "assistant", content: "It's 18C." },
        ]),
      ),
    ).toEqual([
      { role: "user", content: "Weather?" },
      {
        role: "assistant",
        content: "Checking.",
        tool_calls: [
          {
            id: "c1",
            type: "function",
            function: { name: "weather", arguments: '{"city":"Paris"}' },
          },
        ],
      },
      { role: "tool", tool_call_id: "c1", content: "18C" },
      { role: "assistant", content: "It's 18C." },
    ]);
  });

  it("gives a tool call with no text before it an assistant message of its own", () => {
    expect(
      chatCompletionsConverter.fromItems(
        stored([
          { type: "message", role: "user", content: "Go" },
          { type: "function_call", call_id: "c1", name: "run", arguments: "{}" },
          { type: "function_call_output", call_id: "c1", output: "done" },
        ]),
      ),
    ).toEqual([
      { role: "user", content: "Go" },
      {
        role: "assistant",
        content: null,
        tool_calls: [{ id: "c1", type: "function", function: { name: "run", arguments: "{}" } }],
      },
      { role: "tool", tool_call_id: "c1", content: "done" },
    ]);
  });

  it("keeps user images as image_url parts", () => {
    expect(
      chatCompletionsConverter.fromItems(
        stored([
          {
            type: "message",
            role: "user",
            content: [
              { type: "input_text", text: "What is this?" },
              { type: "input_image", image_url: "https://img.test/cat.png", detail: "low" },
            ],
          },
        ]),
      ),
    ).toEqual([
      {
        role: "user",
        content: [
          { type: "text", text: "What is this?" },
          { type: "image_url", image_url: { url: "https://img.test/cat.png", detail: "low" } },
        ],
      },
    ]);
  });

  it("drops tool calls and results without their pair, and other item types", () => {
    expect(
      chatCompletionsConverter.fromItems(
        stored([
          { type: "reasoning", summary: [] },
          { type: "function_call", call_id: "stopped", name: "slow", arguments: "{}" },
          { type: "function_call_output", call_id: "orphan", output: "zzz" },
          { type: "message", role: "assistant", content: "Hi." },
        ]),
      ),
    ).toEqual([{ role: "assistant", content: "Hi." }]);
  });

  it("joins a tool result given as parts", () => {
    const messages = chatCompletionsConverter.fromItems(
      stored([
        { type: "function_call", call_id: "c1", name: "list", arguments: "{}" },
        {
          type: "function_call_output",
          call_id: "c1",
          output: [
            { type: "output_text", text: "a," },
            { type: "output_text", text: "b" },
          ],
        },
      ]),
    );
    expect(messages.at(-1)).toEqual({ role: "tool", tool_call_id: "c1", content: "a,b" });
  });
});

describe("chatCompletionsConverter round trip", () => {
  it("reads back the stored turn as the messages it came from, minus system messages", () => {
    const turn: ChatCompletionMessageParam[] = [
      { role: "system", content: "Be brief." },
      { role: "user", content: "Book a table" },
      {
        role: "assistant",
        content: "Booking.",
        tool_calls: [
          { id: "t1", type: "function", function: { name: "book", arguments: '{"people":2}' } },
        ],
      },
      { role: "tool", tool_call_id: "t1", content: "booked" },
      { role: "assistant", content: "Done." },
    ];
    const items = stored(chatCompletionsConverter.toItems(turn));
    expect(chatCompletionsConverter.fromItems(items)).toEqual(turn.slice(1));
  });
});

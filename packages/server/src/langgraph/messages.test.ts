import {
  AIMessage,
  coerceMessageLikeToMessage,
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from "@langchain/core/messages";
import { describe, expect, it } from "vitest";
import type { ConversationItem } from "../conversations/types";
import { langGraphConverter } from "./messages";

/** Items as OpenUI Cloud returns them: with an id. */
const stored = (items: object[]) =>
  items.map((item, i) => ({
    id: `item_${i}`,
    object: "conversation.item",
    conversation_id: "conv_1",
    ...item,
  })) as ConversationItem[];

describe("langGraphConverter.toItems", () => {
  it("converts a turn with a tool call, skipping system messages", () => {
    expect(
      langGraphConverter.toItems([
        new SystemMessage("Be brief."),
        new HumanMessage("Table for 2 at 8?"),
        new AIMessage({
          content: "Booking.",
          tool_calls: [{ id: "t1", name: "book", args: { people: 2 }, type: "tool_call" }],
        }),
        new ToolMessage({ tool_call_id: "t1", content: "confirmed" }),
        new AIMessage("Booked for 8pm."),
      ]),
    ).toEqual([
      {
        type: "message",
        role: "user",
        content: [{ type: "input_text", text: "Table for 2 at 8?" }],
      },
      { type: "message", role: "assistant", content: [{ type: "output_text", text: "Booking." }] },
      { type: "function_call", call_id: "t1", name: "book", arguments: '{"people":2}' },
      { type: "function_call_output", call_id: "t1", output: "confirmed" },
      {
        type: "message",
        role: "assistant",
        content: [{ type: "output_text", text: "Booked for 8pm." }],
      },
    ]);
  });

  it("keeps text and image blocks, defaulting an image's detail to auto", () => {
    const [item] = langGraphConverter.toItems([
      new HumanMessage({
        content: [
          { type: "text", text: "Compare " },
          { type: "text", text: "" },
          { type: "image_url", image_url: "https://img.test/a.png" },
          { type: "image_url", image_url: { url: "https://img.test/b.png", detail: "high" } },
        ],
      }),
    ]);
    expect(item).toEqual({
      type: "message",
      role: "user",
      content: [
        { type: "input_text", text: "Compare " },
        { type: "input_image", image_url: "https://img.test/a.png", detail: "auto" },
        { type: "input_image", image_url: "https://img.test/b.png", detail: "high" },
      ],
    });
  });

  it("drops a tool call with no result and a result with no call", () => {
    expect(
      langGraphConverter.toItems([
        new AIMessage({
          content: "",
          tool_calls: [{ id: "stopped", name: "slow", args: {}, type: "tool_call" }],
        }),
        new ToolMessage({ tool_call_id: "orphan", content: "zzz" }),
        new AIMessage("Hi."),
      ]),
    ).toEqual([
      { type: "message", role: "assistant", content: [{ type: "output_text", text: "Hi." }] },
    ]);
  });

  it("stores an empty tool result as {}", () => {
    const items = langGraphConverter.toItems([
      new AIMessage({
        content: "",
        tool_calls: [{ id: "t1", name: "ping", args: {}, type: "tool_call" }],
      }),
      new ToolMessage({ tool_call_id: "t1", content: "" }),
    ]);
    expect(items.at(-1)).toEqual({ type: "function_call_output", call_id: "t1", output: "{}" });
  });
});

describe("langGraphConverter.fromItems", () => {
  it("returns plain messages, with tool calls on the AI message before them", () => {
    expect(
      langGraphConverter.fromItems(
        stored([
          { type: "message", role: "user", content: "Book a table" },
          {
            type: "message",
            role: "assistant",
            content: [{ type: "output_text", text: "Booking." }],
          },
          { type: "function_call", call_id: "t1", name: "book", arguments: '{"people":2}' },
          { type: "function_call_output", call_id: "t1", output: "booked" },
          { type: "function_call", call_id: "t2", name: "remind", arguments: "not json" },
          { type: "function_call_output", call_id: "t2", output: "ok" },
        ]),
      ),
    ).toEqual([
      { role: "human", content: "Book a table" },
      {
        role: "ai",
        content: "Booking.",
        tool_calls: [{ type: "tool_call", id: "t1", name: "book", args: { people: 2 } }],
      },
      { role: "tool", content: "booked", tool_call_id: "t1" },
      // No text before it: its own AI message. Arguments that aren't JSON become {}.
      {
        role: "ai",
        content: "",
        tool_calls: [{ type: "tool_call", id: "t2", name: "remind", args: {} }],
      },
      { role: "tool", content: "ok", tool_call_id: "t2" },
    ]);
  });

  it("keeps user images as image_url blocks", () => {
    expect(
      langGraphConverter.fromItems(
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
        role: "human",
        content: [
          { type: "text", text: "What is this?" },
          { type: "image_url", image_url: { url: "https://img.test/cat.png", detail: "low" } },
        ],
      },
    ]);
  });

  it("drops tool calls and results without their pair, and other item types", () => {
    expect(
      langGraphConverter.fromItems(
        stored([
          { type: "reasoning", summary: [] },
          { type: "function_call", call_id: "stopped", name: "slow", arguments: "{}" },
          { type: "function_call_output", call_id: "orphan", output: "zzz" },
          { type: "message", role: "assistant", content: "Hi." },
        ]),
      ),
    ).toEqual([{ role: "ai", content: "Hi." }]);
  });
});

describe("langGraphConverter round trip", () => {
  it("reads back messages LangChain turns into the same messages, which store as the same items", () => {
    const turn = [
      new HumanMessage("Table for 2 at 8?"),
      new AIMessage({
        content: "",
        tool_calls: [
          { id: "t1", name: "book", args: { people: 2, at: "20:00" }, type: "tool_call" },
        ],
      }),
      new ToolMessage({ tool_call_id: "t1", content: "confirmed" }),
      new AIMessage("Booked for 8pm."),
    ];
    const items = langGraphConverter.toItems(turn);
    const history = langGraphConverter.fromItems(stored(items)).map(coerceMessageLikeToMessage);

    expect(history.map((message) => message.type)).toEqual(["human", "ai", "tool", "ai"]);
    expect(AIMessage.isInstance(history[1]) && history[1].tool_calls?.[0]?.args).toEqual({
      people: 2,
      at: "20:00",
    });
    expect(langGraphConverter.toItems(history)).toEqual(items);
  });
});

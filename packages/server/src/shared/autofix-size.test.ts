import type { UIMessageChunk } from "ai";
import type {
  ChatCompletionChunk,
  ChatCompletionMessageParam,
} from "openai/resources/chat/completions";
import { describe, expect, it, vi } from "vitest";
import { createAutofix as createOpenAIAutofix } from "../openai";
import { createAutofix as createVercelAutofix } from "../vercel";
import { repairContext } from "./utils";

const library = {
  root: "Card",
  components: { Card: { signature: "Card(title: string)" } },
  schema: {
    $defs: { Card: { properties: { title: { type: "string" } }, required: ["title"] } },
  },
};
const title = "x".repeat(100_001);
const invalid = `root = Unknown("${title}")`;
const fixed = `root = Card("${title}")`;
const messages: ChatCompletionMessageParam[] = [
  { role: "user", content: "Keep this entire request: " + "y".repeat(8_001) },
  { role: "assistant", content: [{ type: "text", text: "z".repeat(9_000) }] },
];

function setup() {
  const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(
    Response.json({
      choices: [{ message: { role: "assistant", content: fixed } }],
      fix_summary: { status: "fixed", fixed_errors: [], unfixed_errors: [] },
    }),
  );
  return { fetch, options: { apiKey: "test", library, fetch } };
}

async function* stream<T>(events: T[]) {
  yield* events;
}

describe("Autofix without character caps", () => {
  it("accepts a large valid generation without a repair request", async () => {
    const { fetch, options } = setup();
    const result = await createOpenAIAutofix(options).completions.fix({ generation: fixed });
    expect(result).toMatchObject({ status: "already_valid", original: fixed, content: fixed });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("sends a large invalid generation and full context to the API", async () => {
    const { fetch, options } = setup();
    const result = await createOpenAIAutofix(options).completions.fix({
      generation: invalid,
      messages,
    });
    expect(result).toMatchObject({ status: "fixed", original: invalid, content: fixed });
    const body = JSON.parse(fetch.mock.calls[0]![1]!.body as string);
    expect(body.messages.slice(1)).toEqual([
      { role: "user", content: messages[0]!.content },
      { role: "assistant", content: "z".repeat(9_000) },
      { role: "assistant", content: invalid },
    ]);
  });

  it("keeps the latest 20 context turns with each turn's full text", () => {
    const history: ChatCompletionMessageParam[] = Array.from({ length: 21 }, (_, i) => ({
      role: "user",
      content: `${i}:` + "x".repeat(9_000),
    }));
    expect(
      repairContext([
        ...history,
        { role: "tool", tool_call_id: "ignored", content: "ignored" },
        { role: "assistant", content: null },
      ]),
    ).toEqual(history.slice(1));
  });

  it("repairs large OpenAI output before releasing its closing fence and stop", async () => {
    const { fetch, options } = setup();
    const framed = "```openui\n" + invalid + "\n```";
    const chunk = (content: string, finish_reason: "stop" | null = null): ChatCompletionChunk => ({
      id: "completion",
      object: "chat.completion.chunk",
      created: 1,
      model: "test",
      choices: [{ index: 0, delta: { content }, finish_reason }],
    });
    const output = createOpenAIAutofix(options).completions.stream({
      messages,
      stream: stream([
        chunk(framed.slice(0, 90_000)),
        chunk(framed.slice(90_000)),
        chunk("", "stop"),
      ]),
    });
    const chunks: ChatCompletionChunk[] = [];
    for await (const event of output.chunks) chunks.push(event);
    expect(fetch).toHaveBeenCalledOnce();
    expect(JSON.parse(fetch.mock.calls[0]![1]!.body as string).messages.at(-1).content).toBe(
      framed,
    );
    expect(
      chunks.flatMap((c) => c.choices.map((choice) => choice.delta.content ?? "")).join(""),
    ).toBe("```openui\n" + invalid + "\n\n" + fixed + "\n```");
    expect(chunks.at(-1)?.choices[0]?.finish_reason).toBe("stop");
    await expect(output.result).resolves.toMatchObject({ status: "fixed", content: fixed });
  });

  it("repairs large Vercel output before releasing its closing fence and text-end", async () => {
    const { fetch, options } = setup();
    const framed = "```openui\n" + invalid + "\n```";
    const events: UIMessageChunk[] = [
      { type: "start", messageId: "message" },
      { type: "start-step" },
      { type: "text-start", id: "text" },
      { type: "text-delta", id: "text", delta: framed.slice(0, 90_000) },
      { type: "text-delta", id: "text", delta: framed.slice(90_000) },
      { type: "text-end", id: "text" },
      { type: "finish-step" },
      { type: "finish", finishReason: "stop" },
    ];
    const output = createVercelAutofix(options).ai.stream({ stream: stream(events), messages });
    const chunks: UIMessageChunk[] = [];
    for await (const event of output.chunks) chunks.push(event);
    expect(fetch).toHaveBeenCalledOnce();
    expect(JSON.parse(fetch.mock.calls[0]![1]!.body as string).messages.at(-1).content).toBe(
      framed,
    );
    expect(
      chunks
        .filter((c) => c.type === "text-delta")
        .map((c) => c.delta)
        .join(""),
    ).toBe("```openui\n" + invalid + "\n\n" + fixed + "\n```");
    expect(chunks.findIndex((c) => c.type === "text-end")).toBeGreaterThan(
      chunks.findIndex((c) => c.type === "text-delta" && c.delta.includes(fixed)),
    );
    await expect(output.result).resolves.toMatchObject({ status: "fixed", content: fixed });
  });
});

import type { UIMessageChunk } from "ai";
import type { ChatCompletionChunk } from "openai/resources/chat/completions";
import { afterEach, describe, expect, it, vi } from "vitest";
import { caught, fakeFetch, json } from "../__tests__/fake-fetch";
import { createCloudApi } from "../core/http";
import { openAIAdapter } from "../openai/adapter";
import { vercelAIAdapter } from "../vercel/adapter";
import { createAutofix } from "./create-autofix";
import type { CreateAutofixParams } from "./types";

afterEach(() => vi.unstubAllEnvs());

// `library.toSpec()` for one component, Card(title).
const library = {
  root: "Card",
  components: { Card: { signature: "Card(title: string)", description: "A card" } },
  schema: {
    type: "object",
    properties: { Card: { $ref: "#/$defs/Card" } },
    $defs: {
      Card: {
        type: "object",
        properties: { title: { type: "string" } },
        required: ["title"],
        description: "A card",
      },
    },
  },
} as unknown as CreateAutofixParams["library"];

const valid = 'root = Card("a")';
// `x` is never reached from root, so the program needs a repair.
const invalid = 'root = Card("a")\nx = Card("b")';
const fixed = {
  choices: [{ message: { content: 'root = Card("fixed")' } }],
  fix_summary: { status: "fixed", fixed_errors: [], unfixed_errors: [] },
};

function setup(reply: () => Response = () => json(fixed), apiKey: string | undefined = "k") {
  const { fetch, requests } = fakeFetch(reply);
  const api = createCloudApi({ apiKey, baseUrl: "https://cloud.test/", fetch });
  return { autofix: createAutofix(api, { library }, openAIAdapter), requests };
}

describe("fix", () => {
  it("returns a valid program as is, with no request and no key", async () => {
    vi.stubEnv("THESYS_API_KEY", "");
    const { autofix, requests } = setup(undefined, undefined);
    expect(await autofix.fix({ generation: valid })).toMatchObject({
      status: "already_valid",
      content: valid,
    });
    expect(requests).toHaveLength(0);
  });

  it("sends an invalid program to /v1/autofix after the conversation", async () => {
    const { autofix, requests } = setup();
    const result = await autofix.fix({
      generation: invalid,
      messages: [{ role: "user", content: "a card" }],
    });
    expect(result).toMatchObject({ status: "fixed", content: 'root = Card("fixed")' });
    expect(requests[0]).toMatchObject({
      method: "POST",
      headers: { Authorization: "Bearer k", "Content-Type": "application/json" },
    });
    expect(requests[0]!.url.href).toBe("https://cloud.test/v1/autofix");
    const { messages } = requests[0]!.body as { messages: Array<{ role: string }> };
    expect(messages.map((m) => m.role)).toEqual(["system", "user", "assistant"]);
    expect(messages[2]).toEqual({ role: "assistant", content: invalid });
  });

  it.each([
    ["a failed request", () => json({ error: { message: "bad key" } }, 401), "http_error", 401],
    ["an unreadable reply", () => new Response("<html>"), "invalid_response", undefined],
    ["a reply without a summary", () => json({}), "invalid_response", undefined],
  ])("throws AutofixError on %s", async (_, reply, code, status) => {
    const { autofix } = setup(reply);
    const error = await caught(() => autofix.fix({ generation: invalid }));
    expect(error).toMatchObject({ name: "AutofixError", code });
    expect((error as { status?: number }).status).toBe(status);
  });

  it("throws AutofixError missing_api_key before any request", async () => {
    vi.stubEnv("THESYS_API_KEY", "");
    const { autofix, requests } = setup(undefined, "");
    expect(await caught(() => autofix.fix({ generation: invalid }))).toMatchObject({
      name: "AutofixError",
      code: "missing_api_key",
    });
    expect(requests).toHaveLength(0);
  });

  it("refuses a generation over 100,000 characters", async () => {
    const { autofix } = setup();
    expect(await caught(() => autofix.fix({ generation: "x".repeat(100_001) }))).toMatchObject({
      code: "generation_too_large",
    });
  });

  it("needs a library with a schema", () => {
    const api = createCloudApi({ apiKey: "k" });
    expect(() =>
      createAutofix(api, { library: { ...library, schema: undefined } as never }, openAIAdapter),
    ).toThrow("A library spec with schema is required");
  });
});

const fenced = "```openui\n" + invalid + "\n```";

async function collect<T>(chunks: AsyncIterable<T>) {
  const out: T[] = [];
  for await (const chunk of chunks) out.push(chunk);
  return out;
}

describe("stream", () => {
  it("adds the repair inside the closing fence of a Chat Completions stream", async () => {
    const { fetch } = fakeFetch(() => json(fixed));
    const api = createCloudApi({ apiKey: "k", fetch });
    const autofix = createAutofix(api, { library }, openAIAdapter);
    const base = { id: "c1", object: "chat.completion.chunk" as const, created: 1, model: "m" };
    async function* source(): AsyncGenerator<ChatCompletionChunk> {
      yield { ...base, choices: [{ index: 0, delta: { content: fenced }, finish_reason: null }] };
      yield { ...base, choices: [{ index: 0, delta: {}, finish_reason: "stop" }] };
    }
    const output = autofix.stream({ stream: source() });
    const chunks = await collect(output.chunks);
    const text = chunks.map((c) => c.choices[0]?.delta.content ?? "").join("");
    expect(text).toBe("```openui\n" + invalid + '\n\nroot = Card("fixed")\n```');
    expect(chunks.at(-1)!.choices[0]!.finish_reason).toBe("stop");
    expect((await output.result)?.status).toBe("fixed");
  });

  it("adds the repair inside the closing fence of an AI SDK UI message stream", async () => {
    const { fetch } = fakeFetch(() => json(fixed));
    const api = createCloudApi({ apiKey: "k", fetch });
    const autofix = createAutofix(api, { library }, vercelAIAdapter);
    async function* source(): AsyncGenerator<UIMessageChunk> {
      yield { type: "start" };
      yield { type: "start-step" };
      yield { type: "text-start", id: "t" };
      yield { type: "text-delta", id: "t", delta: fenced };
      yield { type: "text-end", id: "t" };
      yield { type: "finish-step" };
      yield { type: "finish", finishReason: "stop" };
    }
    const output = autofix.stream({ stream: source() });
    const chunks = await collect(output.chunks);
    const text = chunks.map((c) => (c.type === "text-delta" ? c.delta : "")).join("");
    expect(text).toBe("```openui\n" + invalid + '\n\nroot = Card("fixed")\n```');
    expect(chunks.at(-1)).toEqual({ type: "finish", finishReason: "stop" });
    expect((await output.result)?.status).toBe("fixed");
  });

  it("can only be read once", async () => {
    const { autofix } = setup();
    async function* source(): AsyncGenerator<ChatCompletionChunk> {}
    const output = autofix.stream({ stream: source() });
    await collect(output.chunks);
    expect(await caught(() => collect(output.chunks))).toMatchObject({ code: "stream_consumed" });
  });
});

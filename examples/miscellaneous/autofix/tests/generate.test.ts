import assert from "node:assert/strict";
import test from "node:test";
import { generateAndRepair, type GenerationOptions } from "../src/lib/generate";
import { streamGeneration, generationPrompt } from "../src/lib/provider";
import {
  type ChatEvent,
  type AutofixCompletion,
  MAX_GENERATION_CHARS,
} from "../src/lib/contract";
import { samples } from "./fixtures";

const valid = samples[4].generation;
const invalid = samples[0].generation;
const messages = [{ role: "user" as const, content: samples[0].context }];
const options = (): GenerationOptions => ({
  apiKey: "provider-test-key",
  autofixKey: "repair-test-key",
  model: "test-model",
  signal: new AbortController().signal,
});
function chunks(text: string) {
  return async function* () {
    yield text.slice(0, 20);
    yield text.slice(20);
  };
}
function fixed(): AutofixCompletion {
  return {
    choices: [{ message: { content: valid } }],
    fix_summary: {
      status: "fixed",
      fixed_errors: [
        { code: "unknown-component", message: "Heading is unavailable." },
      ],
      unfixed_errors: [],
    },
  };
}
async function collect(iterable: AsyncIterable<ChatEvent>) {
  const events: ChatEvent[] = [];
  for await (const event of iterable) events.push(event);
  return events;
}

test("streams the real provider response using a full library prompt and separate credentials", async () => {
  let calls = 0;
  const stream = streamGeneration(messages, {
    ...options(),
    fetcher: async (url, init) => {
      calls++;
      assert.equal(String(url), "https://api.openai.com/v1/chat/completions");
      assert.equal(
        new Headers(init?.headers).get("authorization"),
        "Bearer provider-test-key",
      );
      const body = JSON.parse(String(init?.body));
      assert.equal(body.model, "test-model");
      assert.equal(body.stream, true);
      assert.equal(body.messages[0].content, generationPrompt);
      assert.ok(!generationPrompt.startsWith("]]>openui:config"));
      assert.ok(generationPrompt.includes("Metric"));
      assert.deepEqual(body.messages.slice(1), messages);
      return new Response(
        'data: {"choices":[{"delta":{"content":"root = "},"finish_reason":null}]}\n\ndata: {"choices":[{"delta":{"content":"Card([])"},"finish_reason":"stop"}]}\n\ndata: [DONE]\n\n',
        { headers: { "Content-Type": "text/event-stream" } },
      );
    },
  });
  let result = "";
  for await (const text of stream) result += text;
  assert.equal(result, "root = Card([])");
  assert.equal(calls, 1);
});

test("waits for all generation chunks, then skips Autofix for valid output", async () => {
  const events = await collect(
    generateAndRepair(messages, {
      ...options(),
      generate: chunks(valid),
      repair: async () => assert.fail("valid UI must not call Autofix"),
    }),
  );
  assert.deepEqual(
    events.map((e) => e.type),
    ["delta", "delta", "result"],
  );
  assert.deepEqual(events.at(-1), {
    type: "result",
    report: {
      generation: valid,
      output: valid,
      status: "valid",
      fixedErrors: [],
      remainingErrors: [],
    },
  });
});

test("a disconnected OpenAI stream is not treated as a completed generation", async () => {
  const events = generateAndRepair(messages, {
    ...options(),
    generate: (context, config) =>
      streamGeneration(context, {
        ...config,
        fetcher: async () =>
          new Response(
            'data: {"choices":[{"delta":{"content":"root = Card([])"},"finish_reason":null}]}\n\n',
            { headers: { "Content-Type": "text/event-stream" } },
          ),
      }),
    repair: async () => assert.fail("must not repair a disconnected stream"),
  });
  assert.equal((await events.next()).value?.type, "delta");
  await assert.rejects(events.next(), /ended before generation completed/);
});

test("invalid model output is repaired once with real preceding conversation and separate key", async () => {
  const history = [
    ...messages,
    { role: "assistant" as const, content: valid },
    { role: "user" as const, content: "Change the title to September." },
  ];
  let calls = 0;
  const config = options();
  const events = await collect(
    generateAndRepair(history, {
      ...config,
      generate: async function* (context) {
        assert.deepEqual(context, history);
        yield invalid;
      },
      repair: async (input, repairOptions) => {
        calls++;
        assert.equal(input.generation, invalid);
        assert.deepEqual(input.context, history);
        assert.equal(repairOptions.apiKey, "repair-test-key");
        assert.equal(repairOptions.signal, config.signal);
        return fixed();
      },
    }),
  );
  assert.equal(calls, 1);
  assert.deepEqual(
    events.map((e) => e.type),
    ["delta", "repairing", "result"],
  );
  const result = events.at(-1);
  assert.equal(result?.type, "result");
  if (result?.type !== "result") assert.fail();
  assert.equal(result.report.generation, invalid);
  assert.equal(result.report.output, valid);
});

test("failed repairs preserve the original generation and never publish invalid output", async () => {
  for (const completion of [
    { ...fixed(), choices: [{ message: { content: invalid } }] },
    {
      choices: [{ message: { content: null } }],
      fix_summary: {
        status: "fix_failed" as const,
        fixed_errors: [],
        unfixed_errors: [
          { code: "unknown-component", message: "Heading unavailable" },
        ],
      },
    },
  ]) {
    const events = await collect(
      generateAndRepair(messages, {
        ...options(),
        generate: chunks(invalid),
        repair: async () => completion,
      }),
    );
    const last = events.at(-1);
    if (last?.type !== "result") assert.fail();
    assert.equal(last.report.status, "fix_failed");
    assert.equal(last.report.output, null);
    assert.equal(last.report.generation, invalid);
    assert.ok(last.report.remainingErrors.length > 0);
  }
});

test("cancellation before or during repair prevents a stale result", async () => {
  const controller = new AbortController();
  const iterator = generateAndRepair(messages, {
    ...options(),
    signal: controller.signal,
    generate: chunks(invalid),
    repair: async () => assert.fail("must not repair after cancellation"),
  });
  await iterator.next();
  await iterator.next();
  assert.equal((await iterator.next()).value?.type, "repairing");
  controller.abort();
  await assert.rejects(iterator.next(), { name: "AbortError" });

  const pending = new AbortController();
  await assert.rejects(
    collect(
      generateAndRepair(messages, {
        ...options(),
        signal: pending.signal,
        generate: chunks(invalid),
        repair: async () => {
          pending.abort();
          return fixed();
        },
      }),
    ),
    { name: "AbortError" },
  );
});

test("empty, oversized, or interrupted model output never triggers a repair", async () => {
  for (const generate of [
    chunks(""),
    chunks("x".repeat(MAX_GENERATION_CHARS + 1)),
    async function* () {
      yield "root = ";
      throw new Error("provider disconnected");
    },
  ]) {
    await assert.rejects(
      collect(
        generateAndRepair(messages, {
          ...options(),
          generate,
          repair: async () =>
            assert.fail("incomplete transport is not a completed generation"),
        }),
      ),
    );
  }
});

import assert from "node:assert/strict";
import test from "node:test";
import { POST } from "../src/app/api/chat/route";
import spec from "../src/generated/spec.json";
import {
  AutofixError,
  buildAutofixRequest,
  requestAutofix,
} from "../src/lib/autofix";
import {
  inputSchema,
  MAX_CONTEXT_CHARS,
  MAX_GENERATION_CHARS,
} from "../src/lib/contract";
import { samples } from "./fixtures";
import { findErrors } from "../src/lib/validation";
import { createAutofixChat, readReply } from "../src/lib/autofix-chat";
import { EventType, type AGUIEvent } from "@openuidev/react-headless";

for (const sample of samples) {
  test(`the real parser validates the ${sample.id} fixture`, () => {
    const errors = findErrors(sample.generation);
    if (sample.expectedError === null) assert.deepEqual(errors, []);
    else
      assert.ok(
        errors.some((error) => error.code === sample.expectedError),
        JSON.stringify(errors),
      );
  });
}

test("sends the generated library as the first config turn and the original generation last", () => {
  const input = inputSchema.parse({
    generation: samples[3].generation,
    context: [{ role: "user", content: "Show revenue." }],
  });
  const body = buildAutofixRequest(input);
  assert.equal(body.messages[0].role, "system");
  assert.ok(body.messages[0].content.startsWith("]]>openui:config\n"));
  const config = JSON.parse(
    body.messages[0].content.slice("]]>openui:config\n".length),
  );
  assert.deepEqual(config.chatLibrary.schema, spec.schema);
  assert.equal(config.chatLibrary.root, "Card");
  assert.equal("libraryVersion" in config, false);
  assert.equal("library" in body, false);
  assert.deepEqual(body.messages.slice(1), [
    { role: "user", content: "Show revenue." },
    { role: "assistant", content: samples[3].generation },
  ]);
  assert.equal(body.stream, false);
});

test("empty context is omitted, while source whitespace is preserved", () => {
  const generation = `\n${samples[4].generation}\n`;
  const body = buildAutofixRequest(inputSchema.parse({ generation }));
  assert.equal(body.messages.length, 2);
  assert.equal(body.messages[1].content, generation);
});

test("rejects empty, oversized, or client-supplied library requests before transport", () => {
  for (const body of [
    { generation: "  " },
    { generation: "x".repeat(MAX_GENERATION_CHARS + 1) },
    {
      generation: "root = Card([])",
      context: [{ role: "user", content: "x".repeat(MAX_CONTEXT_CHARS + 1) }],
    },
    { generation: "root = Card([])", library: {} },
  ])
    assert.equal(inputSchema.safeParse(body).success, false);
  assert.equal(
    inputSchema.safeParse({
      generation: "x".repeat(MAX_GENERATION_CHARS),
      context: [{ role: "user", content: "x".repeat(MAX_CONTEXT_CHARS) }],
    }).success,
    true,
  );
});

function completion(status: "fixed" | "already_valid" | "fix_failed") {
  return {
    choices: [
      {
        message: {
          content: status === "fix_failed" ? null : samples[4].generation,
        },
      },
    ],
    fix_summary: {
      status,
      fixed_errors: [],
      unfixed_errors:
        status === "fix_failed"
          ? [{ code: "unresolved", message: "Missing note." }]
          : [],
    },
    usage: { prompt_tokens: 40, completion_tokens: 10, total_tokens: 50 },
  };
}

for (const status of ["fixed", "already_valid", "fix_failed"] as const) {
  test(`preserves the ${status} completion and keeps credentials in the server request`, async () => {
    const controller = new AbortController();
    const result = await requestAutofix(
      { generation: samples[0].generation, context: [] },
      {
        apiKey: "test-server-key",
        signal: controller.signal,
        fetcher: async (url, init) => {
          assert.equal(url, "https://api.thesys.dev/v1/autofix");
          assert.equal(
            new Headers(init?.headers).get("Authorization"),
            "Bearer test-server-key",
          );
          assert.equal(init?.signal, controller.signal);
          assert.equal(init?.cache, "no-store");
          assert.equal(
            JSON.parse(String(init?.body)).messages.at(-1).role,
            "assistant",
          );
          return Response.json(completion(status));
        },
      },
    );
    assert.deepEqual(result, completion(status));
    assert.equal(JSON.stringify(result).includes("test-server-key"), false);
  });
}

test("maps upstream authentication, limits, unavailable routes, and server failures", async () => {
  for (const status of [400, 401, 403, 404, 429, 500]) {
    await assert.rejects(
      requestAutofix(
        { generation: samples[0].generation, context: [] },
        {
          apiKey: "test-key",
          fetcher: async () =>
            new Response("private upstream details", { status }),
        },
      ),
      (error: unknown) =>
        error instanceof AutofixError &&
        error.status === (status === 500 ? 502 : status) &&
        !error.message.includes("private upstream"),
    );
  }
});

test("rejects malformed or inconsistent success responses", async () => {
  for (const value of [
    {},
    { ...completion("fixed"), choices: [{ message: { content: null } }] },
    {
      ...completion("fix_failed"),
      choices: [{ message: { content: "not a repair" } }],
    },
    { ...completion("already_valid"), choices: [] },
  ]) {
    await assert.rejects(
      requestAutofix(
        { generation: samples[0].generation, context: [] },
        {
          apiKey: "test-key",
          fetcher: async () => Response.json(value),
        },
      ),
      (error: unknown) => error instanceof AutofixError && error.status === 502,
    );
  }
  await assert.rejects(
    requestAutofix(
      { generation: samples[0].generation, context: [] },
      {
        apiKey: "test-key",
        fetcher: async () => new Response("not json"),
      },
    ),
    /unexpected response/,
  );
});

test("the Next route rejects invalid JSON and invalid inputs without an API key", async () => {
  for (const body of ["{", JSON.stringify({ generation: " " })]) {
    const response = await POST(
      new Request("http://localhost/api/chat", { method: "POST", body }),
    );
    assert.equal(response.status, 400);
    assert.equal(typeof (await response.json()).error, "string");
  }
});

test("missing credentials produce an actionable setup response without contacting the API", async () => {
  const saved = process.env.THESYS_API_KEY;
  delete process.env.THESYS_API_KEY;
  try {
    const response = await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        body: JSON.stringify({
          messages: [{ role: "user", content: "Show revenue" }],
        }),
      }),
    );
    assert.equal(response.status, 503);
    assert.match((await response.json()).error, /\.env\.local/);
  } finally {
    if (saved === undefined) delete process.env.THESYS_API_KEY;
    else process.env.THESYS_API_KEY = saved;
  }
});

test("OpenAI failures become actionable stream errors without leaking upstream details", async (t) => {
  const names = [
    "OPENAI_API_KEY",
    "THESYS_API_KEY",
    "OPENAI_BASE_URL",
  ] as const;
  const saved = names.map((name) => process.env[name]);
  t.after(() =>
    names.forEach((name, index) => {
      if (saved[index] === undefined) delete process.env[name];
      else process.env[name] = saved[index];
    }),
  );
  process.env.OPENAI_API_KEY = "provider-test-key";
  process.env.THESYS_API_KEY = "repair-test-key";
  delete process.env.OPENAI_BASE_URL;
  let status = 429;
  let calls = 0;
  t.mock.method(globalThis, "fetch", async (url: string | URL | Request) => {
    assert.equal(String(url), "https://api.openai.com/v1/chat/completions");
    calls++;
    return Response.json(
      {
        error: {
          message: "private upstream details",
          type: "test_error",
          code: "test_error",
        },
      },
      { status },
    );
  });
  for (const [code, expected] of [
    [401, /OPENAI_API_KEY/],
    [404, /OPENAI_MODEL/],
    [429, /insufficient credits/],
    [500, /OpenAI could not complete/],
  ] as const) {
    status = code;
    const llm = createAutofixChat(async (url, init) =>
      POST(new Request(new URL(String(url), "http://localhost"), init)),
    );
    const response = await llm.send({
      threadId: "test",
      signal: new AbortController().signal,
      messages: [{ id: "u", role: "user", content: "Show revenue" }],
    });
    assert.equal(response.headers.get("Content-Type"), "text/event-stream");
    const events: AGUIEvent[] = [];
    for await (const event of llm.streamProtocol.parse(response))
      events.push(event);
    const event = events.at(-1);
    if (event?.type !== EventType.RUN_ERROR)
      assert.fail("expected a standard AG-UI error");
    assert.match(event.message, expected);
    assert.doesNotMatch(
      JSON.stringify(events),
      /private upstream|provider-test-key|repair-test-key/,
    );
  }
  assert.equal(calls, 4);
});

test("fetchLLM and the Next route stream valid and repaired replies through the built-in AG-UI decoder", async (t) => {
  const names = [
    "OPENAI_API_KEY",
    "THESYS_API_KEY",
    "OPENAI_BASE_URL",
    "AUTOFIX_API_URL",
  ] as const;
  const saved = names.map((name) => process.env[name]);
  t.after(() =>
    names.forEach((name, index) => {
      if (saved[index] === undefined) delete process.env[name];
      else process.env[name] = saved[index];
    }),
  );
  process.env.OPENAI_API_KEY = "provider-test-key";
  process.env.THESYS_API_KEY = "repair-test-key";
  delete process.env.OPENAI_BASE_URL;
  delete process.env.AUTOFIX_API_URL;
  let generation: string = samples[4].generation;
  let repairs = 0;
  t.mock.method(
    globalThis,
    "fetch",
    async (url: string | URL | Request, init?: RequestInit) => {
      if (String(url) === "https://api.openai.com/v1/chat/completions") {
        const chunk = {
          choices: [{ delta: { content: generation }, finish_reason: "stop" }],
        };
        return new Response(
          `data: ${JSON.stringify(chunk)}\n\ndata: [DONE]\n\n`,
          { headers: { "Content-Type": "text/event-stream" } },
        );
      }
      assert.equal(String(url), "https://api.thesys.dev/v1/autofix");
      assert.equal(
        JSON.parse(String(init?.body)).messages.at(-1).content,
        generation,
      );
      repairs++;
      return Response.json(completion("fixed"));
    },
  );
  const llm = createAutofixChat(async (url, init) =>
    POST(new Request(new URL(String(url), "http://localhost"), init)),
  );
  for (const expected of ["valid", "fixed"]) {
    generation =
      expected === "valid" ? samples[4].generation : samples[0].generation;
    const response = await llm.send({
      threadId: "test",
      signal: new AbortController().signal,
      messages: [{ id: "u", role: "user", content: "Show revenue" }],
    });
    assert.equal(response.status, 200);
    const events: AGUIEvent[] = [];
    for await (const event of llm.streamProtocol.parse(response))
      events.push(event);
    assert.equal(events.at(-1)?.type, EventType.TEXT_MESSAGE_END);
    const content = events
      .flatMap((event) =>
        event.type === EventType.TEXT_MESSAGE_CONTENT ? [event.delta] : [],
      )
      .join("");
    const reply = readReply(content);
    assert.equal(reply.report?.status, expected);
    assert.equal(reply.report?.generation, generation);
    assert.equal(findErrors(reply.report?.output ?? "").length, 0);
  }
  assert.equal(repairs, 1);
});

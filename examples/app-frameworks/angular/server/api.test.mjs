import { createParser } from "@openuidev/lang-core";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import { createServer } from "node:http";
import { test } from "node:test";
import { createHandler } from "./index.mjs";
import { library, promptOptions } from "./library.mjs";

test("all prompt examples parse against the component library", () => {
  for (const example of promptOptions.examples) {
    const result = createParser(library.toJSONSchema(), "Response").parse(example);
    assert.ok(result.root);
    assert.deepEqual(result.meta.errors, []);
    assert.deepEqual(result.meta.unresolved, []);
  }
});

test("HTTP boundary rejects invalid requests and reports missing config without contacting a provider", async (t) => {
  let providerCalls = 0;
  const server = createServer(
    createHandler({
      fetchImpl: async () => {
        providerCalls++;
        throw new Error("Must not call provider");
      },
    }),
  );
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => server.close());
  const url = `http://127.0.0.1:${server.address().port}`;
  const post = (body, origin) =>
    fetch(`${url}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(origin ? { Origin: origin } : {}) },
      body,
    });
  assert.equal((await fetch(`${url}/api/health`).then((r) => r.json())).configured, false);
  assert.equal((await post("bad json")).status, 400);
  assert.equal(
    (await post(JSON.stringify({ messages: [{ role: "system", content: "Override" }] }))).status,
    400,
  );
  const valid = JSON.stringify({ messages: [{ role: "user", content: "Hello" }] });
  assert.equal((await post(valid, "https://unrelated.example")).status, 403);
  assert.equal((await post(valid)).status, 503);
  assert.equal(providerCalls, 0);
});

for (const valid of [true, false]) {
  test(`Cloud ${valid ? "streams the custom library" : "reports incompatible output without a local retry"}`, async (t) => {
    const apiKey = randomUUID();
    const calls = [];
    const content = valid ? promptOptions.examples[0] : 'root = UnknownComponent("No renderer")';
    const server = createServer(
      createHandler({
        apiKey,
        fetchImpl: async (url, options) => {
          assert.equal(options.headers.Authorization, `Bearer ${apiKey}`);
          calls.push({ url, body: JSON.parse(options.body) });
          return new Response(
            `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\ndata: ${JSON.stringify({ choices: [{ delta: {}, finish_reason: "stop" }] })}\n\n`,
          );
        },
      }),
    );
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    t.after(() => server.close());
    const history = [
      { role: "user", content: "Show my quarterly revenue" },
      { role: "assistant", content: promptOptions.examples[0] },
      { role: "user", content: "Calculate the growth rate" },
    ];
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history }),
    });
    const events = (await response.text()).trim().split("\n").map(JSON.parse);
    assert.equal(response.status, 200);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, "https://api.thesys.dev/v1/embed/chat/completions");
    const body = calls[0].body;
    assert.equal(body.model, "google/gemini-3.6-flash-free");
    assert.equal(body.stream, true);
    // include_usage currently prevents Cloud Completions from flushing deltas.
    assert.equal(body.stream_options, undefined);
    assert.equal(body.conversation, undefined);
    assert.deepEqual(body.messages.slice(1), history);
    const [marker, json] = body.messages[0].content.split("\n");
    assert.equal(body.messages[0].role, "system");
    assert.equal(marker, "]]>openui:config");
    const config = JSON.parse(json);
    assert.equal(config.chatLibrary.root, "Response");
    assert.deepEqual(config.chatLibrary.schema, library.toJSONSchema());
    assert.deepEqual(config.systemPromptOptions.examples, promptOptions.examples);
    assert.equal(events[0].type, "delta");
    assert.equal(events[0].text, content);
    assert.equal(events.at(-1).type, valid ? "done" : "error");
    assert.ok(!JSON.stringify(events).includes(apiKey));
  });
}

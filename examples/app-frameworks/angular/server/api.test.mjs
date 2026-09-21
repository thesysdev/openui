import { createParser } from "@openuidev/lang-core";
import assert from "node:assert/strict";
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

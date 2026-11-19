// Block Kit streaming: createCardPreview debounces chat.update, renders only
// complete lines, skips unrenderable prefixes and unchanged output, drops
// chart placeholders, and stops cleanly on dispose.
import assert from "node:assert/strict";
import { test } from "vitest";
import { createEngine } from "../core";
import { createCardPreview, slackChannel } from "../slack";

const engine = createEngine(slackChannel, { quiet: true });

function fakeClient() {
  const updates: any[] = [];
  return {
    updates,
    chat: {
      update: async (args: any) => {
        updates.push(args);
        return { ok: true };
      },
    },
  };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

test("streams a growing card: debounced updates, final blocks match the program", async () => {
  const client = fakeClient();
  const preview = createCardPreview(client, "C1", "1.0", (s) => engine.renderState(s), {
    interval: 20,
  });

  preview.push("root = Root([title, label])\n");
  preview.push('title = Header("Hi")\n');
  await sleep(60);
  preview.push('label = Section("Body text")\n');
  await sleep(60);
  await preview.dispose();

  assert.ok(
    client.updates.length >= 1 && client.updates.length <= 3,
    `got ${client.updates.length} updates`,
  );
  const last = client.updates.at(-1);
  assert.deepEqual(
    last.blocks.map((b: any) => b.type),
    ["header", "section"],
  );
  assert.equal(last.channel, "C1");
  assert.equal(last.ts, "1.0");
});

test("skips prefixes that render nothing and incomplete last lines", async () => {
  const client = fakeClient();
  const preview = createCardPreview(client, "C1", "1.0", (s) => engine.renderState(s), {
    interval: 10,
  });

  preview.push("root = Root([title])"); // no newline: not a complete line yet
  await sleep(40);
  assert.equal(client.updates.length, 0);

  preview.push('\ntitle = Header("Now'); // root complete, title line torn
  await sleep(40);
  assert.equal(client.updates.length, 0); // root's only child is unresolved -> no blocks

  preview.push('")\n');
  await sleep(40);
  await preview.dispose();
  assert.equal(client.updates.length, 1);
  assert.equal(client.updates[0].blocks[0].type, "header");
});

test("identical renders are not re-sent", async () => {
  const client = fakeClient();
  const preview = createCardPreview(client, "C1", "1.0", (s) => engine.renderState(s), {
    interval: 10,
  });
  preview.push('root = Root([title])\ntitle = Header("Hi")\n');
  await sleep(40);
  preview.push("// a comment that changes nothing\n");
  await sleep(40);
  await preview.dispose();
  assert.equal(client.updates.length, 1);
});

test("chart placeholders are dropped mid-stream; native charts pass through", async () => {
  const client = fakeClient();
  const preview = createCardPreview(client, "C1", "1.0", (s) => engine.renderState(s), {
    interval: 10,
  });
  preview.push("root = Root([c1, c2, c3])\n");
  preview.push(
    'c1 = Chart("bar", ["A"], [1], "One")\nc2 = Chart("bar", ["A"], [1], "Two")\nc3 = Chart("bar", ["A"], [1], "Three")\n',
  );
  await sleep(40);
  await preview.dispose();
  const last = client.updates.at(-1);
  // 2 native charts; the 3rd (downgraded to a placeholder) is dropped from previews.
  assert.deepEqual(
    last.blocks.map((b: any) => b.type),
    ["data_visualization", "data_visualization"],
  );
});

test("push after dispose is ignored and no update follows", async () => {
  const client = fakeClient();
  const preview = createCardPreview(client, "C1", "1.0", (s) => engine.renderState(s), {
    interval: 10,
  });
  await preview.dispose();
  preview.push('root = Root([title])\ntitle = Header("Hi")\n');
  await sleep(40);
  assert.equal(client.updates.length, 0);
});

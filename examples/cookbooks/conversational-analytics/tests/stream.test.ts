import { openAIResponsesAdapter } from "@openuidev/react-headless";
import assert from "node:assert/strict";
import { test } from "node:test";
import { forwardCloudStream } from "../src/lib/cloud-stream";
import { extractProgram } from "../src/lib/openui-content";

async function* events(items: { type: string; [key: string]: unknown }[]) {
  yield* items;
}
async function read(items: { type: string; [key: string]: unknown }[]) {
  const response = new Response(forwardCloudStream(events(items), new AbortController()));
  return Array.fromAsync(openAIResponsesAdapter().parse(response));
}
test("Cloud SSE reaches Agent Interface's native Responses adapter", async () => {
  const parsed = await read([
    {
      type: "response.output_item.added",
      item: { id: "answer", type: "message", role: "assistant" },
    },
    { type: "response.output_text.delta", item_id: "answer", delta: 'root = TextContent("£10")' },
    { type: "response.output_text.done", item_id: "answer" },
    { type: "response.completed" },
  ]);
  assert.ok(
    parsed.some((event) => event.type === "TEXT_MESSAGE_CONTENT" && event.delta.includes("£10")),
  );
  assert.ok(!parsed.some((event) => event.type === "RUN_ERROR"));
});
test("truncated, refused, and failed Cloud streams surface as chat errors", async () => {
  for (const terminal of [
    undefined,
    "response.incomplete",
    "response.failed",
    "response.refusal.delta",
  ]) {
    const parsed = await read([
      { type: "response.output_text.delta", item_id: "answer", delta: "root = " },
      ...(terminal ? [{ type: terminal }] : []),
    ]);
    assert.ok(
      parsed.some((event) => event.type === "RUN_ERROR"),
      terminal,
    );
  }
});
test("cancelling the response aborts the Cloud request", async () => {
  const abort = new AbortController();
  let resume!: () => void;
  const pending = new Promise<void>((resolve) => {
    resume = resolve;
  });
  async function* waiting() {
    await pending;
    yield { type: "response.completed" };
  }
  const body = forwardCloudStream(waiting(), abort);
  await body.cancel();
  assert.ok(abort.signal.aborted);
  resume();
});
test("Cloud envelopes and split marker tails never reach the renderer", () => {
  const program = 'root = TextContent("Sales")';
  assert.equal(extractProgram(program), program);
  assert.equal(
    extractProgram(
      `]]>openui:content?libraryVersion=1\n${program}\n]]>openui:context\n[]\n]]>openui:end`,
    ),
    program,
  );
  assert.equal(extractProgram(`]]>openui:content\n${program}\n]]>openui:en`), program);
  assert.equal(extractProgram("]]>openui:cont"), "");
});

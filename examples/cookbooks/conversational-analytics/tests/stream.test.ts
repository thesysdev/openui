import { openAIResponsesAdapter } from "@openuidev/react-headless";
import assert from "node:assert/strict";
import { test } from "node:test";
import type OpenAI from "openai";
import { streamCloudTurn } from "../src/lib/cloud-stream";
import { extractProgram } from "../src/lib/openui-content";
import { runFunctionToolLoop } from "../src/lib/tool-loop";

type Event = Record<string, unknown>;
async function* events(items: Event[]) {
  yield* items;
}
const params = {
  model: "test",
  input: [{ role: "user" as const, content: "February sales" }],
  store: false,
};
const noContinuation = {
  responses: {
    create: async () => {
      throw new Error("Unexpected continuation");
    },
  },
} as unknown as OpenAI;
async function read(items: Event[]) {
  const response = new Response(
    streamCloudTurn(
      { client: noContinuation, createParams: params, firstStream: events(items), tools: {} },
      new AbortController(),
    ),
  );
  return Array.fromAsync(openAIResponsesAdapter().parse(response));
}
function call(name = "sales_dashboard", id = "call") {
  const item = {
    id,
    call_id: id,
    type: "function_call",
    name,
    arguments: '{"month":"2011-02","country":"Germany"}',
  };
  return [
    { type: "response.output_item.added", item: { ...item, arguments: "" } },
    { type: "response.function_call_arguments.delta", item_id: id, delta: item.arguments },
    { type: "response.function_call_arguments.done", item_id: id, arguments: item.arguments },
    { type: "response.output_item.done", item },
  ];
}

test("real tool calls and outputs reach the native adapter before streamed answer tokens", async () => {
  let continuation: Record<string, unknown> | undefined;
  const client = {
    responses: {
      create: async (input: Record<string, unknown>) => {
        continuation = input;
        return events([
          {
            type: "response.output_item.added",
            item: { id: "answer", type: "message", role: "assistant" },
          },
          { type: "response.output_text.delta", item_id: "answer", delta: 'root = TextContent("' },
          { type: "response.output_text.delta", item_id: "answer", delta: '£9,581.05")' },
          { type: "response.output_text.done", item_id: "answer" },
          { type: "response.completed" },
        ]);
      },
    },
  } as unknown as OpenAI;
  const response = new Response(
    streamCloudTurn(
      {
        client,
        createParams: params,
        firstStream: events([...call(), { type: "response.completed" }]),
        tools: {
          sales_dashboard: async (args) => {
            assert.equal(JSON.parse(args).country, "Germany");
            return '{"sales":"£9,581.05"}';
          },
        },
      },
      new AbortController(),
    ),
  );
  const parsed = await Array.fromAsync(openAIResponsesAdapter().parse(response));
  const types = parsed.map((event) => event.type);
  assert.ok(types.indexOf("TOOL_CALL_START") < types.indexOf("TOOL_CALL_RESULT"));
  assert.ok(types.indexOf("TOOL_CALL_RESULT") < types.indexOf("TEXT_MESSAGE_CONTENT"));
  assert.equal(types.filter((type) => type === "TEXT_MESSAGE_CONTENT").length, 2);
  const history = continuation!.input as Event[];
  assert.equal(history[0].content, "February sales");
  assert.equal(history[1].type, "function_call");
  assert.equal(history[2].type, "function_call_output");
  assert.equal(history[2].call_id, "call");
});

test("streamed program is available before the response closes", async () => {
  let finish!: () => void;
  const pending = new Promise<void>((resolve) => {
    finish = resolve;
  });
  async function* delayed() {
    yield {
      type: "response.output_text.delta",
      item_id: "answer",
      delta: ']]>openui:content\n```openui-lang\nroot = TextContent("Sales")\n',
    };
    await pending;
    yield { type: "response.completed" };
  }
  const response = new Response(
    streamCloudTurn(
      { client: noContinuation, createParams: params, firstStream: delayed(), tools: {} },
      new AbortController(),
    ),
  );
  const iterator = openAIResponsesAdapter().parse(response)[Symbol.asyncIterator]();
  assert.equal((await iterator.next()).value?.type, "TEXT_MESSAGE_START");
  const token = (await iterator.next()).value;
  assert.equal(token?.type, "TEXT_MESSAGE_CONTENT");
  if (token?.type === "TEXT_MESSAGE_CONTENT")
    assert.equal(extractProgram(token.delta), 'root = TextContent("Sales")');
  finish();
  await iterator.next();
});

test("Cloud-owned and already-settled calls are never executed again", async () => {
  let executed = 0;
  await runFunctionToolLoop({
    client: noContinuation,
    createParams: params,
    enqueue: () => {},
    firstStream: events([
      ...call("thesys_internal", "internal"),
      ...call(),
      {
        type: "response.output_item.added",
        item: { type: "function_call_output", call_id: "call", output: "settled" },
      },
      { type: "response.completed" },
    ]),
    tools: {
      sales_dashboard: async () => {
        executed++;
        return "unexpected";
      },
    },
  });
  assert.equal(executed, 0);
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

test("cancelling the response aborts Cloud and prevents a pending tool from executing", async () => {
  const abort = new AbortController();
  let resume!: () => void;
  let executed = 0;
  const pending = new Promise<void>((resolve) => {
    resume = resolve;
  });
  async function* waiting() {
    await pending;
    yield* call();
    yield { type: "response.completed" };
  }
  const body = streamCloudTurn(
    {
      client: noContinuation,
      createParams: params,
      firstStream: waiting(),
      tools: {
        sales_dashboard: async () => {
          executed++;
          return "unexpected";
        },
      },
    },
    abort,
  );
  await body.cancel();
  assert.ok(abort.signal.aborted);
  resume();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(executed, 0);
});

test("Cloud envelopes and incomplete code fences do not block rendering", () => {
  const program = 'root = TextContent("Sales")';
  for (const suffix of ["", "\n`", "\n``", "\n```", "\n```\n]]>openui:end"]) {
    assert.equal(
      extractProgram(`]]>openui:content?thesys=true\n\`\`\`openui-lang\n${program}${suffix}`),
      program,
    );
  }
  assert.equal(extractProgram("]]>openui:cont"), "");
  assert.equal(extractProgram("]]>openui:content\n```openui-"), "");
});

test("executor errors are sent back to Cloud and the final allowed round disables more calls", async () => {
  let continuation: Record<string, unknown> | undefined;
  const client = {
    responses: {
      create: async (input: Record<string, unknown>) => {
        continuation = input;
        return events([{ type: "response.completed" }]);
      },
    },
  } as unknown as OpenAI;
  const forwarded: Event[] = [];
  await runFunctionToolLoop({
    client,
    createParams: params,
    enqueue: (event) => forwarded.push(event),
    maxRounds: 1,
    firstStream: events([...call(), { type: "response.completed" }]),
    tools: {
      sales_dashboard: async () => {
        throw new Error("Unsupported country");
      },
    },
  });
  assert.equal(continuation!.tool_choice, "none");
  const history = continuation!.input as Event[];
  assert.match(String(history.at(-1)?.output), /Unsupported country/);
  assert.ok(
    forwarded.some((event) => (event.item as Event | undefined)?.type === "function_call_output"),
  );
});

test("persisted Cloud continuations send only new tool outputs to the same conversation", async () => {
  let continuation: Record<string, unknown> | undefined;
  const client = {
    responses: {
      create: async (input: Record<string, unknown>) => {
        continuation = input;
        return events([{ type: "response.completed" }]);
      },
    },
  } as unknown as OpenAI;
  await runFunctionToolLoop({
    client,
    createParams: { ...params, conversation: "saved-conversation", store: true },
    firstStream: events([...call(), { type: "response.completed" }]),
    tools: { sales_dashboard: async () => '{"sales":"£9,581.05"}' },
    enqueue: () => {},
  });
  assert.equal(continuation?.conversation, "saved-conversation");
  assert.equal(continuation?.store, true);
  assert.deepEqual(continuation?.input, [
    { type: "function_call_output", call_id: "call", output: '{"sales":"£9,581.05"}' },
  ]);
});

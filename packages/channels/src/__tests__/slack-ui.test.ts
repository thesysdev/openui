// createSlackUI end to end against a fake WebClient: streaming a card, clicks,
// form modals, and the README's issue-tracker workflow (Query + Mutation).
import assert from "node:assert/strict";
import { test } from "vitest";
import { createSlackUI } from "../slack";

function fakeClient() {
  const calls: { method: string; args: any }[] = [];
  let n = 0;
  const record = (method: string) => async (args: any) => {
    calls.push({ method, args });
    return { ok: true, ts: method === "chat.postMessage" ? `100.${++n}` : args.ts };
  };
  return {
    calls,
    of: (method: string) => calls.filter((c) => c.method === method).map((c) => c.args),
    chat: {
      postMessage: record("chat.postMessage"),
      update: record("chat.update"),
      delete: record("chat.delete"),
    },
    views: { open: record("views.open") },
  };
}

async function* chunks(text: string, size = 7): AsyncIterable<string> {
  for (let i = 0; i < text.length; i += size) yield text.slice(i, i + size);
}

const clickPayload = (channel: string, ts: string, action: any, extra: any = {}) => ({
  type: "block_actions",
  channel: { id: channel },
  message: { ts },
  actions: [action],
  ...extra,
});

/** Fill an opened modal's inputs and build the view_submission payload Slack would send. */
function submitModal(view: any, values: Record<string, string>) {
  const state: Record<string, any> = {};
  for (const block of view.blocks) {
    const id = block.element.action_id;
    state[block.block_id] = { [id]: { type: block.element.type, value: values[id] ?? "" } };
  }
  return { type: "view_submission", view: { ...view, state: { values: state } } };
}

const COUNTER = `
root = Root([title, label, acts])
$count = 0
title = Header("Counter")
label = Section("Count is *" + $count + "*")
acts = Actions([Button("+1", Action([@Set($count, $count + 1)]))])
`.trim();

test("streamCard: placeholder in the thread, final card in place, state saved", async () => {
  const client = fakeClient();
  const ui = createSlackUI({ interval: 5 });
  const card = await ui.streamCard(
    client,
    { channel: "C1", thread_ts: "9.9" },
    chunks("```\n" + COUNTER + "\n```"),
  );

  const [placeholder] = client.of("chat.postMessage");
  assert.equal(placeholder.channel, "C1");
  assert.equal(placeholder.thread_ts, "9.9");

  assert.equal(card.ts, "100.1");
  assert.equal(card.source, COUNTER, "code fences are stripped from the returned source");
  const final = client.of("chat.update").at(-1);
  assert.equal(final.ts, card.ts);
  assert.deepEqual(
    final.blocks.map((b: any) => b.type),
    ["header", "section", "actions"],
  );
  assert.deepEqual(card.state, { $count: 0 });
});

test("handleAction: a click re-renders in place and persists the new state", async () => {
  const client = fakeClient();
  const ui = createSlackUI({ interval: 5 });
  const card = await ui.streamCard(client, { channel: "C1" }, chunks(COUNTER));
  const button = card.output.find((b: any) => b.type === "actions")!.elements[0];

  for (let i = 0; i < 2; i++) {
    await ui.handleAction(
      client,
      clickPayload("C1", card.ts, { type: "button", action_id: button.action_id }),
    );
  }
  const final = client.of("chat.update").at(-1);
  assert.equal(final.blocks[1].text.text, "Count is *2*");
});

test("handleAction ignores messages it didn't post and link buttons", async () => {
  const client = fakeClient();
  const ui = createSlackUI();
  await ui.handleAction(client, clickPayload("C1", "123.456", { type: "button", action_id: "x" }));
  await ui.handleAction(
    client,
    clickPayload("C1", "123.456", { type: "button", action_id: "x", url: "https://e.com" }),
  );
  assert.equal(client.calls.length, 0);
});

test("streamCard: a failing model stream removes the placeholder and rethrows", async () => {
  const client = fakeClient();
  const ui = createSlackUI({ interval: 5 });
  async function* broken(): AsyncIterable<string> {
    yield "root = Root([title])\n";
    throw new Error("model went away");
  }
  await assert.rejects(ui.streamCard(client, { channel: "C1" }, broken()), /model went away/);
  assert.deepEqual(client.of("chat.delete"), [{ channel: "C1", ts: "100.1" }]);
});

test("the README issues workflow: Query on render and click, Mutation from a form", async () => {
  const issues = [{ title: "Fix login", state: "open" }];
  const calls: string[] = [];
  const ui = createSlackUI({
    interval: 5,
    tools: {
      specs: [
        { name: "list_issues", description: "Count issues", inputSchema: {}, outputSchema: {} },
        { name: "create_issue", description: "Create an issue", inputSchema: {}, outputSchema: {} },
      ] as any,
      provider: {
        async callTool(name: string, args: any) {
          calls.push(`${name}(${JSON.stringify(args)})`);
          if (name === "list_issues")
            return { total: issues.filter((i) => i.state === (args.state ?? "open")).length };
          if (name === "create_issue") {
            issues.push({ title: String(args.title), state: "open" });
            return { ok: true };
          }
          throw new Error(`unknown tool: ${name}`);
        },
      },
    },
  });
  assert.match(ui.prompt, /Query\(/, "tools teach the model Query()");

  const program = `
root = Root([header, summary, filters, newIssue])
$state = "open"
$title = ""
issues = Query("list_issues", { state: $state }, { total: 0 })
create = Mutation("create_issue", { title: $title })
header = Header("Issues")
summary = Section("You have *" + issues.total + "* " + $state + " issues")
filters = Actions([Button("Open", Action([@Set($state, "open")])), Button("Closed", Action([@Set($state, "closed")]))])
newIssue = Form("New issue", "Create", [TextInput("Title", $title)], Action([@Run(create), @Reset($title)]))
`.trim();

  const client = fakeClient();
  const card = await ui.streamCard(client, { channel: "C1" }, chunks(program));
  const summary = () =>
    client
      .of("chat.update")
      .at(-1)
      .blocks.find((b: any) => b.type === "section").text.text;

  // Previews never call tools; the final render runs the query once.
  assert.deepEqual(calls, ['list_issues({"state":"open"})']);
  assert.equal(summary(), "You have *1* open issues");

  // Clicking "Closed" re-runs the query with the new filter.
  const buttons = card.output.find(
    (b: any) => b.type === "actions" && b.elements.length === 2,
  )!.elements;
  await ui.handleAction(
    client,
    clickPayload("C1", card.ts, { type: "button", action_id: buttons[1].action_id }),
  );
  assert.equal(summary(), "You have *0* closed issues");
  await ui.handleAction(
    client,
    clickPayload("C1", card.ts, { type: "button", action_id: buttons[0].action_id }),
  );

  // The form button opens a modal...
  const formButton = card.output.find(
    (b: any) => b.type === "actions" && b.elements[0].action_id.startsWith("form:"),
  )!.elements[0];
  await ui.handleAction(
    client,
    clickPayload(
      "C1",
      card.ts,
      { type: "button", action_id: formButton.action_id },
      { trigger_id: "T1" },
    ),
  );
  const [opened] = client.of("views.open");
  assert.equal(opened.trigger_id, "T1");

  // ...and submitting it runs the mutation, after which the query sees the new issue.
  await ui.handleViewSubmission(client, submitModal(opened.view, { $title: "Write docs" }));
  assert.ok(calls.includes('create_issue({"title":"Write docs"})'), calls.join("\n"));
  assert.deepEqual(
    issues.map((i) => i.title),
    ["Fix login", "Write docs"],
  );
  assert.equal(summary(), "You have *2* open issues");
});

test("deliver override receives every finished card", async () => {
  const client = fakeClient();
  const delivered: string[] = [];
  const ui = createSlackUI({
    interval: 5,
    deliver: async ({ ts, result }) => {
      delivered.push(`${ts}:${result.output.length}`);
    },
  });
  const card = await ui.streamCard(client, { channel: "C1" }, chunks(COUNTER));
  assert.deepEqual(delivered, [`${card.ts}:3`]);
});

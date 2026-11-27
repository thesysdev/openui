// Discord Components V2: the one-container envelope, button-row merging,
// message limits, interaction and modal decoding, and streamed previews.
import assert from "node:assert/strict";
import { test } from "vitest";
import { createEngine } from "../core";
import {
  createCardPreview,
  decodeComponent,
  decodeModalSubmit,
  discordChannel,
  formModal,
  IS_COMPONENTS_V2,
} from "../discord";
import { validateDiscord, validateDiscordModal } from "./schemas/validators";

const engine = createEngine(discordChannel);
const quiet = createEngine(discordChannel, { quiet: true });
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const card = `
$range = "30"
$goal = 100
title = Header("Downloads")
c = Chart("area", ["Mon", "Tue"], [1, 2], "Weekly")
range = Select("range", $range, "Range", [Option("30", "Last 30 days"), Option("90", "Last 90 days")])
goal = Form("Set a goal", "Save", [NumberInput("Weekly goal", $goal)])
open = Button("Refresh", Action([@Set($range, "30")]), "secondary")
row = Actions([open, LinkButton("npm", "https://www.npmjs.com")])
root = Root([title, c, range, goal, row], "#7C5CFF")
`.trim();

test("renders one container with the Components V2 flag and accent color", async () => {
  const r = await engine.renderState(card);
  assert.equal(r.output.flags, IS_COMPONENTS_V2);
  assert.equal(r.output.components.length, 1);
  const [container] = r.output.components;
  assert.equal(container.type, 17);
  assert.equal(container.accent_color, 0x7c5cff);
  assert.deepEqual(validateDiscord(r.output), []);
});

test("charts become attachment:// media and are recorded for upload", async () => {
  const r = await engine.renderState(card);
  const gallery = r.output.components[0].components.find((c: any) => c.type === 12);
  assert.equal(gallery.items[0].media.url, `attachment://${r.charts[0].id}.png`);
  assert.equal(r.charts[0].type, "area");
});

test("a Form button and the next Actions row share one row", async () => {
  const r = await engine.renderState(card);
  const rows = r.output.components[0].components.filter((c: any) => c.type === 1);
  const buttons = rows.find((row: any) => row.components[0].type === 2);
  assert.deepEqual(
    buttons.components.map((b: any) => b.label),
    ["Set a goal", "Refresh", "npm"],
  );
  assert.ok(buttons.components[0].custom_id.startsWith("form:"));
  assert.equal(buttons.components[2].style, 5);
});

test("rows that would exceed 5 buttons stay separate", async () => {
  const src = `
a = Actions([Button("1"), Button("2"), Button("3")])
b = Actions([Button("4"), Button("5"), Button("6")])
root = Root([a, b])`.trim();
  const r = await engine.renderState(src);
  const rows = r.output.components[0].components;
  assert.deepEqual(
    rows.map((row: any) => row.components.length),
    [3, 3],
  );
});

test("long programs are truncated to Discord's 40-component limit", async () => {
  const lines = Array.from({ length: 60 }, (_, i) => `t${i} = Text("line ${i}")`);
  const src = [...lines, `root = Root([${lines.map((_, i) => `t${i}`).join(", ")}])`].join("\n");
  const r = await engine.renderState(src);
  assert.deepEqual(validateDiscord(r.output), []);
  assert.ok(r.output.components[0].components.length < 40);
});

test("select picks and button presses decode to engine interactions", async () => {
  const r = await engine.renderState(card);
  const select = r.output.components[0].components.find(
    (c: any) => c.type === 1 && c.components[0].type === 3,
  ).components[0];
  const pick = decodeComponent({ custom_id: select.custom_id, values: ["90"] });
  assert.deepEqual(pick, { actionId: select.custom_id, value: "90" });
  const next = await engine.applyInteraction(card, r.state, pick);
  assert.equal(next.state.$range, "90");
  assert.deepEqual(decodeComponent({ custom_id: "el_1" }), { actionId: "el_1" });
});

test("a Form button opens a labelled modal whose submit patches state", async () => {
  const r = await engine.renderState(card);
  const button = r.output.components[0].components
    .flatMap((c: any) => c.components ?? [])
    .find((b: any) => b.label === "Set a goal");
  const { formId } = decodeComponent({ custom_id: button.custom_id });
  assert.ok(formId);
  const modal = formModal(formId!, r.forms[formId!]);
  assert.deepEqual(validateDiscordModal(modal), []);
  assert.equal(modal.components[0].type, 18);
  assert.equal(modal.components[0].component.value, "100");

  const submit = decodeModalSubmit(
    {
      custom_id: modal.custom_id,
      components: [{ type: 18, component: { type: 4, custom_id: "$goal", value: "2,000,000" } }],
    },
    r.forms[formId!],
  );
  assert.deepEqual(submit, { actionId: formId, patch: { $goal: 2000000 } });
  const next = await engine.applyInteraction(card, r.state, submit);
  assert.equal(next.state.$goal, 2000000);
});

test("streamed previews are debounced, skip errors, and omit chart attachments", async () => {
  const edits: any[] = [];
  const preview = createCardPreview(
    async (m) => {
      edits.push(m);
    },
    (s) => quiet.renderState(s),
    { interval: 20 },
  );
  preview.push("root = Root([title, c])"); // no newline yet: nothing to render
  await sleep(40);
  assert.equal(edits.length, 0);
  preview.push('\ntitle = Header("Downloads")\n');
  await sleep(40);
  preview.push('c = Chart("bar", ["a"], [1], "Weekly")\n');
  await sleep(40);
  await preview.dispose();
  preview.push('extra = Text("ignored")\n');
  await sleep(40);

  assert.ok(edits.length >= 1 && edits.length <= 2, `got ${edits.length} edits`);
  for (const m of edits) {
    assert.equal(m.flags, IS_COMPONENTS_V2);
    const types = m.components[0].components.map((c: any) => c.type);
    assert.ok(!types.includes(12), "chart attachment leaked into a preview");
  }
  assert.match(edits.at(-1).components[0].components[0].content, /Downloads/);
});

test("a reused button gets unique custom_ids that decode to the same action", async () => {
  const src = `
$n = 0
inc = Button("+1", Action([@Set($n, $n + 1)]))
root = Root([Actions([inc]), Text("again"), Actions([inc])])`.trim();
  const r = await engine.renderState(src);
  assert.deepEqual(validateDiscord(r.output), []);
  const ids = r.output.components[0].components
    .filter((c: any) => c.type === 1)
    .map((row: any) => row.components[0].custom_id);
  assert.deepEqual(ids, ["inc", "inc~1"]);
  const next = await engine.applyInteraction(src, r.state, decodeComponent({ custom_id: ids[1] }));
  assert.equal(next.state.$n, 1);
});

test("card text cannot ping: every message disables allowed mentions", async () => {
  const r = await engine.renderState(`root = Root([Text("@everyone hi")])`);
  assert.deepEqual(r.output.allowed_mentions, { parse: [] });
});

test("blank or malformed numbers keep the current value", () => {
  const form = {
    title: "",
    submit: "",
    fields: [{ target: "$goal", kind: "number", label: "Goal" }],
  } as any;
  const submit = (value: string) =>
    decodeModalSubmit(
      { custom_id: "form:f", components: [{ type: 18, component: { custom_id: "$goal", value } }] },
      form,
    ).patch;
  assert.deepEqual(submit(""), {});
  assert.deepEqual(submit("1,5"), {});
  assert.deepEqual(submit("abc"), {});
  assert.deepEqual(submit("1.5"), { $goal: 1.5 });
  assert.deepEqual(submit("-2,500"), { $goal: -2500 });
});

test("options, links and forms Discord would reject are dropped, not truncated", async () => {
  const long = "x".repeat(101);
  const src = `
$v = "a"
$w = ""
s = Select("s", $v, "Pick", [Option("a", "A"), Option("${long}", "Long")])
empty = Form("Empty", "Go", [Select("w", $w, "W", [Option("${long}", "Long")])])
link = Actions([LinkButton("Signed", "https://e.com/${"q".repeat(600)}"), Button("Ok")])
root = Root([s, empty, link])`.trim();
  const r = await engine.renderState(src);
  assert.deepEqual(validateDiscord(r.output), []);
  const all = r.output.components[0].components.flatMap((c: any) => c.components ?? []);
  assert.deepEqual(
    all.find((c: any) => c.type === 3).options.map((o: any) => o.value),
    ["a"],
  );
  assert.deepEqual(
    all.filter((c: any) => c.type === 2).map((b: any) => b.label),
    ["Ok"],
  );
});

test("Markdown leaves code spans and fences alone", async () => {
  const src = 'root = Root([Markdown("*bold* and `a*b*c`\\n```\\nx*y*z\\n```")])';
  const r = await engine.renderState(src);
  assert.equal(
    r.output.components[0].components[0].content,
    "**bold** and `a*b*c`\n```\nx*y*z\n```",
  );
});

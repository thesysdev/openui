// Engine behavior: the reactive loop, error handling, defensive rendering,
// and system-prompt invariants. (Successor of the old src/dev/smoke.ts.)
import assert from "node:assert/strict";
import { test } from "vitest";
import { createEngine } from "../core";
import { slackChannel, systemPrompt } from "../slack";
import { samples } from "./fixtures/samples";

const engine = createEngine(slackChannel);

const sectionText = (r: any, i: number) => r.output[i]?.text?.text;

test("counter: render -> +1 -> reset round-trips state and re-renders", async () => {
  const r0 = await engine.renderState(samples.counter);
  assert.equal(r0.state.$count, 0);
  assert.deepEqual(Object.keys(r0.actionMap), ["inc", "dec", "reset"]);
  assert.equal(sectionText(r0, 1), "Count is *0*");

  const r1 = await engine.applyAction(samples.counter, r0.state, "inc");
  assert.equal(r1.state.$count, 1);
  assert.equal(sectionText(r1, 1), "Count is *1*");

  const r2 = await engine.applyAction(samples.counter, r1.state, "reset");
  assert.equal(r2.state.$count, 0);
  assert.equal(sectionText(r2, 1), "Count is *0*");
});

test("unparseable source falls back to the channel's error message", async () => {
  const r = await engine.renderState("this is not openui-lang");
  assert.equal(r.text, "Could not render UI");
  assert.equal(r.output.length, 1);
  assert.match(r.output[0].text.text, /Could not render UI/);
  assert.deepEqual(r.actionMap, {});
});

test("option-based control with no options is skipped, not sent to Slack", async () => {
  const r = await engine.renderState(samples.edge);
  const actions = r.output.find((b: any) => b.type === "actions")!;
  assert.equal(actions.elements.length, 1); // only the good button survives
  assert.equal(actions.elements[0].action_id, "good");
  // The empty select still registered its binding (state writes would work).
  assert.deepEqual(r.actionMap.empty, { kind: "input", target: "$x" });
});

test("fallback text comes from the first header/section", async () => {
  const r = await engine.renderState(samples.counter);
  assert.equal(r.text, "Counter Demo");
});

test("system prompt teaches the interactive vocabulary", () => {
  for (const needle of ["Action(", "@Set", "@Reset", "$", "Root(", "Chart(", "Form("]) {
    assert.ok(systemPrompt.includes(needle), `prompt should mention ${needle}`);
  }
});

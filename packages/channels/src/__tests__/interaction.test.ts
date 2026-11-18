// The unified applyInteraction primitive: sugar equivalence, patch-then-plan
// ordering, and the interaction shapes of other platforms (batched submits).
import assert from "node:assert/strict";
import { test } from "vitest";
import { createEngine } from "../core";
import { slackChannel } from "../slack";
import { samples } from "./fixtures/samples";

const engine = createEngine(slackChannel);
const j = (x: unknown) => JSON.stringify(x);

test("applyAction is sugar for applyInteraction (button)", async () => {
  const r0 = await engine.renderState(samples.counter);
  const a = await engine.applyAction(samples.counter, r0.state, "inc");
  const b = await engine.applyInteraction(samples.counter, r0.state, { actionId: "inc" });
  assert.equal(j(a), j(b));
});

test("applyAction is sugar for applyInteraction (bound input)", async () => {
  const c0 = await engine.renderState(samples.controls);
  const a = await engine.applyAction(samples.controls, c0.state, "sel", "low");
  const b = await engine.applyInteraction(samples.controls, c0.state, {
    actionId: "sel",
    value: "low",
  });
  assert.equal(j(a), j(b));
  assert.equal(a.state.$priority, "low");
});

test("submitForm is sugar for applyInteraction (patch + form action by id)", async () => {
  const f0 = await engine.renderState(samples.form);
  const formId = Object.keys(f0.forms)[0];
  const patch = { $title: "Hi", $points: 7 };
  const a = await engine.submitForm(samples.form, f0.state, formId, patch);
  const b = await engine.applyInteraction(samples.form, f0.state, { actionId: formId, patch });
  assert.equal(j(a), j(b));
  assert.equal(b.state.$saved, "yes", "form's on-submit action ran");
  assert.equal(b.state.$points, 7, "patch applied");
});

test("batched submit (Teams-style): patch merges before the plan runs", async () => {
  const r0 = await engine.renderState(samples.counter);
  const r = await engine.applyInteraction(samples.counter, r0.state, {
    actionId: "inc",
    patch: { $count: 10 },
  });
  assert.equal(r.state.$count, 11); // patch to 10, then @Set($count, $count + 1)
});

test("patch-only interaction re-renders with merged state", async () => {
  const r0 = await engine.renderState(samples.counter);
  const r = await engine.applyInteraction(samples.counter, r0.state, { patch: { $count: 5 } });
  assert.equal(r.state.$count, 5);
  assert.equal((r.output[1] as any).text.text, "Count is *5*");
});

test("unknown actionId is a no-op re-render", async () => {
  const r0 = await engine.renderState(samples.counter);
  const r = await engine.applyInteraction(samples.counter, r0.state, { actionId: "nope" });
  assert.equal(j(r.state), j(r0.state));
  assert.equal(j(r.output), j(r0.output));
});

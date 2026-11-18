// Builds every golden scenario: renders of all sample programs, interactions
// (button, bound input), and the form flow (modal build + submit). Shared by
// golden.test.ts (compare) and generate.ts (regenerate the fixture).
import { createEngine } from "../../core";
import { buildModal, slackChannel } from "../../slack";
import { teamsChannel } from "../../teams";
import { telegramChannel } from "../../telegram";
import { whatsappChannel } from "../../whatsapp";
import { samples } from "./samples";

export async function buildScenarios(): Promise<Record<string, unknown>> {
  const engine = createEngine(slackChannel);
  const waEngine = createEngine(whatsappChannel);
  const tgEngine = createEngine(telegramChannel);
  const teamsEngine = createEngine(teamsChannel);
  const out: Record<string, unknown> = {};

  for (const [name, source] of Object.entries(samples)) {
    const e = name.startsWith("wa")
      ? waEngine
      : name.startsWith("teams")
        ? teamsEngine
        : name.startsWith("tg")
          ? tgEngine
          : engine;
    out[`render:${name}`] = await e.renderState(source);
  }

  // Teams interactions: plain button tap, and the batched submit (Action.Submit
  // delivers the action id plus every input value as one patch).
  const m0 = await teamsEngine.renderState(samples.teamsCounter);
  out["teams:action:inc"] = await teamsEngine.applyAction(samples.teamsCounter, m0.state, "inc");
  const mc = await teamsEngine.renderState(samples.teamsContent);
  out["teams:submit:save"] = await teamsEngine.applyInteraction(samples.teamsContent, mc.state, {
    actionId: "save",
    patch: { $title: "Hello", $points: 5, $urgent: "true", $team: "web" },
  });

  // Telegram interactions: button tap and select pick (edit-in-place model).
  const t0 = await tgEngine.renderState(samples.tgCounter);
  out["tg:action:inc"] = await tgEngine.applyAction(samples.tgCounter, t0.state, "inc");
  const tc = await tgEngine.renderState(samples.tgContent);
  out["tg:action:sel=low"] = await tgEngine.applyAction(samples.tgContent, tc.state, "sel", "low");

  // WhatsApp interactions: button tap (new-message model) and list pick.
  const w0 = await waEngine.renderState(samples.waCounter);
  out["wa:action:inc"] = await waEngine.applyAction(samples.waCounter, w0.state, "el_0");
  const wc = await waEngine.renderState(samples.waContent);
  out["wa:action:sel=low"] = await waEngine.applyAction(samples.waContent, wc.state, "sel", "low");

  const r0 = await engine.renderState(samples.counter);
  const r1 = await engine.applyAction(samples.counter, r0.state, "inc");
  out["action:counter:inc"] = r1;
  out["action:counter:reset"] = await engine.applyAction(samples.counter, r1.state, "reset");

  const c0 = await engine.renderState(samples.controls);
  out["action:controls:sel=low"] = await engine.applyAction(
    samples.controls,
    c0.state,
    "sel",
    "low",
  );
  out["action:controls:chk=[a,b]"] = await engine.applyAction(samples.controls, c0.state, "chk", [
    "a",
    "b",
  ]);

  const f0 = await engine.renderState(samples.form);
  const formId = Object.keys(f0.forms)[0];
  out["modal:form"] = buildModal(
    f0.forms[formId],
    JSON.stringify({ channel: "C1", ts: "1.2", formId }),
  );
  out["submit:form"] = await engine.submitForm(samples.form, f0.state, formId, {
    $title: "Hello",
    $points: 5,
  });

  // The blockkit form covers the email/url/multiselect/time/datetime modal inputs.
  const b0 = await engine.renderState(samples.blockkit);
  const bFormId = Object.keys(b0.forms)[0];
  out["modal:blockkit"] = buildModal(
    b0.forms[bFormId],
    JSON.stringify({ channel: "C1", ts: "1.3", formId: bFormId }),
  );

  // Normalize through JSON so undefined-valued props compare cleanly against the fixture.
  return JSON.parse(JSON.stringify(out));
}

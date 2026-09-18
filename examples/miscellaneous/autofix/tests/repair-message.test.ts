import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { RepairMessage } from "../src/components/repair-message";
import type { RepairReport } from "../src/lib/contract";
import { samples } from "./fixtures";

function renderReport(status: RepairReport["status"], output: string | null) {
  return renderToStaticMarkup(
    createElement(RepairMessage, {
      isStreaming: false,
      message: {
        id: "repair",
        role: "assistant",
        content:
          JSON.stringify({
            type: "result",
            report: {
              generation: samples[0].generation,
              output,
              status,
              fixedErrors: [],
              remainingErrors: [
                {
                  code: "unknown-component",
                  message: "Heading is not available.",
                },
              ],
            },
          }) + "\n",
      },
    }),
  );
}

test("failed repairs preserve source and never render an invalid preview", () => {
  const html = renderReport("fix_failed", null);
  assert.match(html, /Repair incomplete/);
  assert.match(html, /Heading is not available/);
  assert.match(html, /Heading\(&quot;September revenue&quot;\)/);
  assert.doesNotMatch(html, /class="repair-preview"|<summary>Repaired code/);
});

test("invalid success output is blocked by local validation", () => {
  const html = renderReport("fixed", samples[0].generation);
  assert.match(html, /did not pass local validation/);
  assert.doesNotMatch(html, /class="repair-preview"/);
});

test("valid original output clearly says Autofix was skipped", () => {
  const html = renderReport("valid", samples[4].generation);
  assert.match(html, /Autofix skipped/);
  assert.match(html, /No repair request made/);
  assert.match(html, /class="repair-preview"/);
});

test("cancelled or interrupted streams do not display a completed result", () => {
  const html = renderToStaticMarkup(
    createElement(RepairMessage, {
      isStreaming: false,
      message: {
        id: "a",
        role: "assistant",
        content:
          JSON.stringify({ type: "delta", text: "root = Card([])" }) + "\n",
      },
    }),
  );
  assert.match(html, /Generation stopped/);
  assert.doesNotMatch(html, /class="repair-preview"|Repaired automatically/);
});

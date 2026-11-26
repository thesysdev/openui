// recharts 3 renders only an empty wrapper <div> on the server; the error should say how to fix it.
import assert from "node:assert/strict";
import { test, vi } from "vitest";

vi.mock("react-dom/server", () => ({
  renderToStaticMarkup: () => '<div class="recharts-wrapper"></div>',
}));

test("explains the recharts 2 requirement when no <svg> is rendered", async () => {
  const { renderChartPng } = await import("../ui/charts");
  assert.throws(
    () => renderChartPng({ id: "x", type: "bar", labels: ["a"], values: [1] }),
    /recharts 2/,
  );
});

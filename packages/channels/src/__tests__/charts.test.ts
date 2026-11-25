// Chart rasterizer sanity: each type produces a real PNG of plausible size.
// Pixel-exact assertions are deliberately avoided (font/AA differences across
// machines); use `npm run chart` to eyeball actual output.
import assert from "node:assert/strict";
import { test } from "vitest";
import { renderChartPng } from "../ui/charts";

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

for (const type of ["bar", "line", "pie", "area"]) {
  test(`renders a ${type} chart to PNG`, () => {
    const png = renderChartPng({
      id: type,
      type,
      labels: ["Todo", "Doing", "Done"],
      values: [5, 3, 8],
      title: "Issues by state",
      series: "Issues",
      xLabel: "Status",
      yLabel: "Count",
    });
    assert.ok(Buffer.isBuffer(png));
    assert.deepEqual(png.subarray(0, 4), PNG_MAGIC, "PNG magic bytes");
    assert.ok(png.length > 5000, `non-trivial size (got ${png.length})`);
  });
}

test("renders a dark-theme chart to PNG", () => {
  const png = renderChartPng(
    {
      id: "dark",
      type: "bar",
      labels: ["6p", "7p", "8p"],
      values: [4, 2, 1],
      title: "Open tables",
    },
    { theme: "dark" },
  );
  assert.deepEqual(png.subarray(0, 4), PNG_MAGIC, "PNG magic bytes");
  assert.ok(png.length > 5000, `non-trivial size (got ${png.length})`);
});

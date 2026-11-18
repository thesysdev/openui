// Native Slack charts: ChartSpec -> data_visualization mapping, documented
// caps (20 points, 12 pie slices, 20-char labels, 50-char titles), and the
// 2-native-charts-per-message downgrade in finalize.
import assert from "node:assert/strict";
import { test } from "vitest";
import { createEngine } from "../core";
import { CHART_PLACEHOLDER_URL, chartBlock, slackChannel } from "../slack";

const spec = (over: Record<string, unknown> = {}) =>
  ({
    id: "chart_0",
    type: "bar",
    labels: ["Todo", "Doing", "Done"],
    values: [5, 3, 8],
    ...over,
  }) as any;

test("bar chart maps to a data_visualization block with one series", () => {
  const b = chartBlock(
    spec({ title: "Issues by state", series: "Issues", xLabel: "Status", yLabel: "Count" }),
  )!;
  assert.equal(b.type, "data_visualization");
  assert.equal(b.block_id, "chart_0");
  assert.equal(b.title, "Issues by state");
  assert.equal(b.chart.type, "bar");
  assert.deepEqual(b.chart.axis_config, {
    categories: ["Todo", "Doing", "Done"],
    x_label: "Status",
    y_label: "Count",
  });
  assert.deepEqual(b.chart.series, [
    {
      name: "Issues",
      data: [
        { label: "Todo", value: 5 },
        { label: "Doing", value: 3 },
        { label: "Done", value: 8 },
      ],
    },
  ]);
});

test("title is required: falls back to series then 'Chart', clipped to 50", () => {
  assert.equal(chartBlock(spec({ series: "Open issues" }))!.title, "Open issues");
  assert.equal(chartBlock(spec())!.title, "Chart");
  const long = chartBlock(spec({ title: "x".repeat(80) }))!;
  assert.equal(long.title.length, 50);
});

test("pie uses segments and drops non-positive values", () => {
  const b = chartBlock(spec({ type: "pie", labels: ["A", "B", "C"], values: [1, 0, 2] }))!;
  assert.equal(b.chart.type, "pie");
  assert.deepEqual(b.chart.segments, [
    { label: "A", value: 1 },
    { label: "C", value: 2 },
  ]);
  assert.equal(b.chart.series, undefined);
  assert.equal(b.chart.axis_config, undefined);
});

test("pie with no positive values falls back to a bar chart", () => {
  const b = chartBlock(spec({ type: "pie", values: [0, -1, 0] }))!;
  assert.equal(b.chart.type, "bar");
});

test("unknown type falls back to bar; no data yields no block", () => {
  assert.equal(chartBlock(spec({ type: "scatter" }))!.chart.type, "bar");
  assert.equal(chartBlock(spec({ labels: [], values: [] })), null);
  assert.equal(chartBlock(spec({ values: ["nope", "nah", "no"] })), null);
});

test("caps: 20 data points, 12 pie slices, 20-char de-duplicated labels", () => {
  const many = Array.from({ length: 30 }, (_, i) => `label ${i}`);
  const vals = Array.from({ length: 30 }, (_, i) => i + 1);
  const bar = chartBlock(spec({ labels: many, values: vals }))!;
  assert.equal(bar.chart.series[0].data.length, 20);
  assert.equal(bar.chart.axis_config.categories.length, 20);

  const pie = chartBlock(spec({ type: "pie", labels: many, values: vals }))!;
  assert.equal(pie.chart.segments.length, 12);

  // Two labels that truncate to the same 20 chars must stay distinct.
  const clash = chartBlock(
    spec({
      labels: ["a very long label that clashes 1", "a very long label that clashes 2"],
      values: [1, 2],
    }),
  )!;
  const cats = clash.chart.axis_config.categories;
  assert.equal(new Set(cats).size, 2);
  for (const c of cats) assert.ok(c.length <= 20, `category over 20 chars: ${c}`);
  assert.deepEqual(
    clash.chart.series[0].data.map((d: any) => d.label),
    cats,
  );
});

test("series name is clipped to 20 chars", () => {
  const b = chartBlock(spec({ series: "a series name well over twenty characters" }))!;
  assert.ok(b.chart.series[0].name.length <= 20);
});

test("render emits native blocks; finalize downgrades the 3rd+ chart to a placeholder", async () => {
  const engine = createEngine(slackChannel);
  const source = `
c1 = Chart("bar", ["A", "B"], [1, 2], "First")
c2 = Chart("pie", ["A", "B"], [1, 2], "Second")
c3 = Chart("line", ["A", "B"], [1, 2], "Third")
root = Root([c1, c2, c3])
`.trim();
  const result = await engine.renderState(source);
  const native = result.output.filter((b: any) => b.type === "data_visualization");
  const placeholders = result.output.filter((b: any) => b.image_url === CHART_PLACEHOLDER_URL);
  assert.equal(native.length, 2);
  assert.equal(placeholders.length, 1);
  // All three specs are recorded so a transport can rasterize any of them.
  assert.equal(result.charts.length, 3);
  assert.equal(placeholders[0].block_id, result.charts[2].id);
});

// @vitest-environment jsdom
// The data morph as the charts drive it: the first data change after mount
// glides (it used to snap), and a chart whose morph carries NaN still lets the
// shared animation loop stop.
import type { ComponentType } from "react";
import { beforeAll, describe, expect, it } from "vitest";
import { ShareBar } from "../ShareBar";
import { ColumnChart } from "./ColumnChart";
import { GoalPace } from "./GoalPace";
import { ProfitWaterfall } from "./ProfitWaterfall";
import { QuadrantChart } from "./QuadrantChart";
import type { QuadrantChartProps } from "./QuadrantChart/types";
import { activeTickCount } from "./shared/spring/ticker";
import { Sparkline } from "./Sparkline";
import { installDom, mount, runFrames } from "./testDom";
import { TrendChart } from "./TrendChart";

beforeAll(() => installDom());

const ATTRS = ["d", "x", "y", "width", "height", "cx", "cy", "r"];
/** The morph-driven geometry of every element under `selector`, as one string. */
function geometry(container: HTMLElement, selector: string): string {
  const els = [...container.querySelectorAll(selector)];
  expect(els.length).toBeGreaterThan(0);
  return els.map((el) => ATTRS.map((a) => el.getAttribute(a)).join(",")).join("|");
}

const axis = (title: string) => ({
  title,
  domain: [0, 10] as [number, number],
  ticks: [0, 10],
  format: (v: number) => String(v),
});
const quadrantProps = (points: QuadrantChartProps["points"]): QuadrantChartProps => ({
  points,
  x: axis("x"),
  y: axis("y"),
  quadrants: { highHigh: "A", lowHigh: "B", highLow: "C", lowLow: "D" },
  describe: () => [],
});

// [chart, props before, props after, a morph-driven mark]
const cases: [string, ComponentType<never>, object, object, string][] = [
  [
    "TrendChart",
    TrendChart as ComponentType<never>,
    { labels: ["a", "b", "c"], series: [{ name: "s", values: [1, 2, 3] }] },
    { labels: ["a", "b", "c"], series: [{ name: "s", values: [3, 1, 2] }] },
    "path.kit-trend-chart-line",
  ],
  [
    "ColumnChart",
    ColumnChart as ComponentType<never>,
    { labels: ["a", "b", "c"], series: [{ name: "s", values: [1, 2, 3] }] },
    { labels: ["a", "b", "c"], series: [{ name: "s", values: [3, 1, 2] }] },
    ".kit-column-chart-bars path",
  ],
  [
    "ProfitWaterfall",
    ProfitWaterfall as ComponentType<never>,
    {
      steps: [
        { label: "Revenue", value: 10, kind: "base" },
        { label: "Cost", value: 4, kind: "subtract" },
        { label: "Profit", value: 6, kind: "total" },
      ],
    },
    {
      steps: [
        { label: "Revenue", value: 10, kind: "base" },
        { label: "Cost", value: 7, kind: "subtract" },
        { label: "Profit", value: 3, kind: "total" },
      ],
    },
    "rect.kit-waterfall-chart-bar",
  ],
  [
    "GoalPace",
    GoalPace as ComponentType<never>,
    { goal: { label: "Goal", goal: 100, labels: ["1", "2", "3", "4"], cumulative: [10, 30] } },
    { goal: { label: "Goal", goal: 100, labels: ["1", "2", "3", "4"], cumulative: [10, 60] } },
    "path.kit-goal-pace-line",
  ],
  [
    "Sparkline",
    Sparkline as ComponentType<never>,
    { values: [1, 2, 3] },
    { values: [3, 1, 2] },
    "path.kit-sparkline-line",
  ],
  [
    "ShareBar",
    ShareBar as ComponentType<never>,
    {
      items: [
        { name: "a", value: 1 },
        { name: "b", value: 3 },
      ],
    },
    {
      items: [
        { name: "a", value: 3 },
        { name: "b", value: 1 },
      ],
    },
    ".kit-share__segments path",
  ],
  [
    "QuadrantChart",
    QuadrantChart as ComponentType<never>,
    quadrantProps([
      { name: "A", x: 2, y: 2, size: 1 },
      { name: "B", x: 8, y: 8, size: 1 },
    ]),
    quadrantProps([
      { name: "A", x: 4, y: 3, size: 1 },
      { name: "B", x: 7, y: 6, size: 1 },
    ]),
    ".kit-quadrant-dot",
  ],
];

describe("first data change after mount", () => {
  it.each(cases)("%s glides from the mounted geometry", (_, Chart, before, after, marks) => {
    const view = mount(Chart, before as never);
    runFrames();
    const mounted = geometry(view.container, marks);
    view.rerender(after as never);
    // Right after the commit the morph has written its current (old) values
    // back over React's target attributes: the glide starts where it was.
    expect(geometry(view.container, marks)).toBe(mounted);
    expect(activeTickCount()).toBeGreaterThan(0);
    expect(runFrames()).toBeGreaterThan(2);
    expect(geometry(view.container, marks)).not.toBe(mounted);
    expect(activeTickCount()).toBe(0);
    view.unmount();
  });
});

describe("a morph carrying NaN settles", () => {
  it("QuadrantChart with labels that do not fit", () => {
    // Crowded points: most labels find no free spot, so they are dropped.
    const points = (dx: number) =>
      Array.from({ length: 6 }, (_, i) => ({
        name: `Point ${i}`,
        x: 5 + dx + i * 0.01,
        y: 5,
        size: 1,
      }));
    const view = mount(QuadrantChart, quadrantProps(points(0)));
    runFrames();
    expect(view.container.querySelectorAll(".kit-quadrant-label").length).toBeLessThan(6);
    view.rerender(quadrantProps(points(1)));
    expect(runFrames(2000)).toBeLessThan(2000);
    view.rerender(quadrantProps(points(2)));
    expect(runFrames(2000)).toBeLessThan(2000);
    expect(activeTickCount()).toBe(0);
    view.unmount();
  });

  it("TrendChart whose series has a gap", () => {
    const labels = ["a", "b", "c", "d"];
    const view = mount(TrendChart, { labels, series: [{ name: "s", values: [1, 2, 3, 4] }] });
    runFrames();
    view.rerender({ labels, series: [{ name: "s", values: [2, Number.NaN, 4, 1] }] });
    expect(runFrames(2000)).toBeLessThan(2000);
    view.rerender({ labels, series: [{ name: "s", values: [3, 1, 2, 4] }] });
    expect(runFrames(2000)).toBeLessThan(2000);
    expect(activeTickCount()).toBe(0);
    view.unmount();
  });
});

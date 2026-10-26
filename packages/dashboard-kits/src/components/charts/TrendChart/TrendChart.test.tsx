// @vitest-environment jsdom
import { beforeAll, describe, expect, it } from "vitest";
import { installDom, mount, runFrames } from "../../../test/testDom";
import { TrendChart } from "./TrendChart";

beforeAll(() => installDom());

/** Every y coordinate in a path's `d`. */
function pathYs(d: string): number[] {
  const nums = (d.match(/-?\d+(\.\d+)?(e-?\d+)?/g) ?? []).map(Number);
  return nums.filter((_, i) => i % 2 === 1);
}

describe("TrendChart series length", () => {
  const labels = ["a", "b", "c", "d"];

  it("draws a series longer than its labels, cut to them", () => {
    const view = mount(TrendChart, {
      labels,
      // Long enough to overrun the morph buffer (labels × series + guides).
      series: [{ name: "s", values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] }],
    });
    runFrames();
    expect(view.container.querySelector("path.kit-trend-chart-line")?.getAttribute("d")).toMatch(
      /^M/,
    );
    // A data change re-runs the morph over the same (cut) buffer.
    view.rerender({ labels, series: [{ name: "s", values: [4, 3, 2, 1, 0, 9, 8, 7, 6, 5] }] });
    runFrames();
    view.unmount();
  });

  it("breaks a shorter series where its data ends instead of diving to the top edge", () => {
    const view = mount(TrendChart, { labels, series: [{ name: "s", values: [3, 4] }] });
    runFrames();
    const d = view.container.querySelector("path.kit-trend-chart-line")!.getAttribute("d")!;
    // The plot starts 14px down; an empty slot used to sit at y = 0.
    expect(Math.min(...pathYs(d))).toBeGreaterThan(10);
    // Two points: one move and one segment, nothing toward the unfilled labels.
    expect(d.match(/[MLC]/g)?.length).toBe(2);
    view.unmount();
  });
});

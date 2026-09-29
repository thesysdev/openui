import { describe, expect, it } from "vitest";
import { BAR_RADIUS } from "../../BarChart/parts/horizontalBarGeometry";
import { MIN_BAR_WIDTH, roundedBarPath } from "./roundedBarPath";

/**
 * Extract the endpoint coordinates of every path command in a `roundedBarPath`
 * `d` string. `M`/`L` endpoints are their single `x,y`; an `A` command's
 * endpoint is its trailing `x,y` (the leading `rx,ry` radii are skipped). Used
 * to assert the drawn path stays inside the bar's box.
 */
function pathPoints(d: string): Array<[number, number]> {
  const points: Array<[number, number]> = [];
  const commands = d.match(/[MLAZ][^MLAZ]*/g) ?? [];
  for (const cmd of commands) {
    const type = cmd[0];
    const nums = (cmd.slice(1).match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
    if (type === "M" || type === "L") {
      points.push([nums[0]!, nums[1]!]);
    } else if (type === "A") {
      // A rx,ry rot large-arc sweep x y → endpoint is the last two numbers.
      points.push([nums[nums.length - 2]!, nums[nums.length - 1]!]);
    }
  }
  return points;
}

describe("MIN_BAR_WIDTH", () => {
  it("matches the openui reference value", () => {
    expect(MIN_BAR_WIDTH).toBe(2);
  });
});

describe("roundedBarPath", () => {
  const positive: [number, number, number, number] = [0, BAR_RADIUS, BAR_RADIUS, 0];

  it("always starts with a move command", () => {
    expect(roundedBarPath(0, 0, 100, 16, positive).startsWith("M ")).toBe(true);
  });
  it("draws arcs when radii > 0 and the bar clears both thresholds", () => {
    const d = roundedBarPath(0, 0, 100, 16, positive);
    expect(d).toContain("A ");
    // both right-side corners round; left side stays straight
    expect(d.match(/A /g)).toHaveLength(2);
  });
  it("rounds only the left end for a negative-shaped radii array", () => {
    const negative: [number, number, number, number] = [BAR_RADIUS, 0, 0, BAR_RADIUS];
    const d = roundedBarPath(0, 0, 100, 16, negative);
    expect(d.match(/A /g)).toHaveLength(2);
  });
  it("suppresses all rounding when the bar is too thin (h < 7)", () => {
    const d = roundedBarPath(0, 0, 100, 6, positive);
    expect(d).not.toContain("A ");
    expect(d.startsWith("M ")).toBe(true);
    expect(d.endsWith("Z")).toBe(true);
  });
  it("keeps rounding at the thickness boundary (h = 7)", () => {
    expect(roundedBarPath(0, 0, 100, 7, positive)).toContain("A ");
  });
  it("suppresses all rounding when the bar is too short (w < MIN_BAR_WIDTH)", () => {
    const d = roundedBarPath(0, 0, 1, 16, positive);
    expect(d).not.toContain("A ");
  });
  it("clamps rounding at the width boundary so the rounded end never overhangs x (w = MIN_BAR_WIDTH)", () => {
    // A 2px-wide bar still rounds, but the per-corner clamp (min(r, w/2, h/2) →
    // radius 1) keeps every coordinate at or right of x — no self-crossing /
    // overhanging path (openui would draw radius 4 here and shoot left of x).
    const d = roundedBarPath(0, 0, MIN_BAR_WIDTH, 16, positive);
    expect(d).toContain("A ");
    const xs = pathPoints(d).map(([px]) => px);
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(0);
  });
  it("draws convex (sweep=1) arcs that stay inside the bar box on a normal positive bar", () => {
    const d = roundedBarPath(0, 0, 100, 16, positive);
    // Both rounded (right-end) corners are convex quarter-arcs: sweep flag = 1.
    const sweeps = d.match(/A [\d.]+,[\d.]+ 0 0 1 /g) ?? [];
    expect(sweeps).toHaveLength(2);
    // No path coordinate escapes [x, x+w] × [y, y+h].
    for (const [px, py] of pathPoints(d)) {
      expect(px).toBeGreaterThanOrEqual(0);
      expect(px).toBeLessThanOrEqual(100);
      expect(py).toBeGreaterThanOrEqual(0);
      expect(py).toBeLessThanOrEqual(16);
    }
  });
  it("emits no arc for an all-zero radii array even on a large bar", () => {
    const d = roundedBarPath(0, 0, 100, 16, [0, 0, 0, 0]);
    expect(d).not.toContain("A ");
    expect(d.startsWith("M ")).toBe(true);
  });
  it("closes the path", () => {
    expect(roundedBarPath(5, 5, 50, 16, positive).endsWith("Z")).toBe(true);
  });
});

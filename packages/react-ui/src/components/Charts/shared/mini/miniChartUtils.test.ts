import { describe, expect, it } from "vitest";
import {
  miniBarGeometry,
  miniBarsLeftPadding,
  miniLineGeometry,
  miniValueDomain,
  recentBarsThatFit,
  recentPointsThatFit,
  rechartsNiceDomain,
  toMiniChartPoints,
} from "./miniChartUtils";

describe("toMiniChartPoints", () => {
  it("accepts numbers and { value, label } objects, labelling by position", () => {
    expect(toMiniChartPoints([4, 7])).toEqual([
      { value: 4, label: "Item 1" },
      { value: 7, label: "Item 2" },
    ]);
    expect(toMiniChartPoints([{ value: 3, label: "Mon" }, { value: 5 }])).toEqual([
      { value: 3, label: "Mon" },
      { value: 5, label: "Item 2" },
    ]);
  });
});

describe("recentPointsThatFit (area / line)", () => {
  const data = Array.from({ length: 30 }, (_, i) => i);

  it("keeps everything when unmeasured or when it all fits", () => {
    expect(recentPointsThatFit(data, 0)).toEqual(data);
    expect(recentPointsThatFit(data.slice(0, 5), 454)).toHaveLength(5);
  });

  it("keeps the most recent points, one per 20px", () => {
    // floor((200 + 20) / 20) = 11
    expect(recentPointsThatFit(data, 200)).toEqual(data.slice(-11));
  });
});

describe("recentBarsThatFit / miniBarsLeftPadding (bar)", () => {
  const data = Array.from({ length: 40 }, (_, i) => i);

  it("keeps the most recent bars, 18px each after 8px padding", () => {
    // floor((200 - 8) / 18) = 10
    expect(recentBarsThatFit(data, 200)).toEqual(data.slice(-10));
    expect(recentBarsThatFit(data, 0)).toEqual(data);
  });

  it("right-aligns short series with left padding, none when full", () => {
    // 454 - 8 - 9 * 18 = 284 (react-ui's Recharts MiniBarChart getPadding)
    expect(miniBarsLeftPadding(9, 454)).toBe(284);
    expect(miniBarsLeftPadding(40, 200)).toBe(0);
  });
});

describe("miniValueDomain", () => {
  it("anchors through zero", () => {
    expect(miniValueDomain([12, 40, 9])).toEqual([0, 40]);
    expect(miniValueDomain([-5, 10])).toEqual([-5, 10]);
    expect(miniValueDomain([])).toEqual([0, 0]);
  });
});

// Coordinates measured from react-ui's Recharts mini charts at 454×454 with
// [12, 18, 9, 22, 30, 26, 34, 28, 40].
const SPARK = [12, 18, 9, 22, 30, 26, 34, 28, 40];

describe("miniLineGeometry (matches Recharts' mini area/line)", () => {
  it("spreads points edge to edge under a 10px top margin", () => {
    const { points, x, y } = miniLineGeometry(SPARK, 454, 454);
    expect(points).toHaveLength(9);
    expect(x(0)).toBe(0);
    expect(x(1)).toBeCloseTo(56.75);
    expect(x(8)).toBe(454);
    expect(y(12)).toBeCloseTo(320.8);
    expect(y(40)).toBe(10);
    expect(y(0)).toBe(454);
  });
});

describe("miniBarGeometry (matches Recharts' mini bar)", () => {
  it("right-aligns 8px bars inside a 5px margin", () => {
    const bars = miniBarGeometry(SPARK, 454, 454);
    expect(bars).toHaveLength(9);
    expect(bars[0]!.x).toBe(293);
    expect(bars[0]!.y).toBeCloseTo(315.8);
    expect(bars[0]!.y + bars[0]!.height).toBeCloseTo(449);
    expect(bars[8]!.y).toBe(5);
  });

  it("hangs negative bars below zero", () => {
    const [bar] = miniBarGeometry([-10, 10], 200, 200);
    expect(bar!.negative).toBe(true);
    expect(bar!.y).toBeCloseTo(100);
  });
});

describe("rechartsNiceDomain (recharts-scale getNiceTickValues, 5 ticks)", () => {
  it("rounds up in 5%-of-magnitude steps", () => {
    expect(rechartsNiceDomain(0, 40)).toEqual([0, 40]);
    expect(rechartsNiceDomain(0, 50)).toEqual([0, 60]);
    expect(rechartsNiceDomain(0, 58)).toEqual([0, 60]);
    expect(rechartsNiceDomain(0, 7900)).toEqual([0, 8000]);
  });

  it("widens the step until five ticks cover signed data", () => {
    expect(rechartsNiceDomain(-5, 10)).toEqual([-5, 15]);
  });

  it("spans 0..4 for all-zero data", () => {
    expect(rechartsNiceDomain(0, 0)).toEqual([0, 4]);
  });
});

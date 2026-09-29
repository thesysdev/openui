import { describe, expect, it } from "vitest";
import {
  BAR_GAP,
  BAR_HEIGHT,
  BAR_RADIUS,
  GROUP_PADDING,
  LINE_PADDING,
  MIN_LINE_DIMENSION,
  SINGLE_ROW_MIN,
  barValue,
  contentHeight,
  groupHeight,
  nearestSnap,
  radiusArray,
  rowOffsets,
  showInternalLine,
  snapPositions,
  stackSegments,
  valueDomain,
  verticalPadding,
} from "./horizontalBarGeometry";

describe("constants", () => {
  it("match the openui reference values", () => {
    expect(BAR_HEIGHT).toBe(16);
    expect(BAR_GAP).toBe(10);
    expect(GROUP_PADDING).toBe(16);
    expect(SINGLE_ROW_MIN).toBe(80);
    expect(BAR_RADIUS).toBe(4);
    expect(MIN_LINE_DIMENSION).toBe(8);
    expect(LINE_PADDING).toBe(6);
  });
});

describe("groupHeight", () => {
  it("grouped: n*(BAR_HEIGHT+BAR_GAP) - BAR_GAP + labelHeight + GROUP_PADDING (worked example → 108)", () => {
    expect(groupHeight(3, "grouped", 24)).toBe(108);
  });
  it("stacked: BAR_HEIGHT + labelHeight + GROUP_PADDING, ignoring seriesCount (worked example → 56)", () => {
    expect(groupHeight(3, "stacked", 24)).toBe(56);
  });
  it("grouped single series collapses the inter-bar gap", () => {
    // 1*(16+10) - 10 + 24 + 16 = 56
    expect(groupHeight(1, "grouped", 24)).toBe(56);
  });
  it("grouped two series", () => {
    // 2*26 - 10 + 24 + 16 = 82
    expect(groupHeight(2, "grouped", 24)).toBe(82);
  });
  it("grouped four series with a taller label", () => {
    // 4*26 - 10 + 20 + 16 = 130
    expect(groupHeight(4, "grouped", 20)).toBe(130);
  });
  it("stacked is independent of seriesCount", () => {
    expect(groupHeight(1, "stacked", 24)).toBe(56);
    expect(groupHeight(5, "stacked", 24)).toBe(56);
  });
  it("stacked honours a taller label", () => {
    // 16 + 30 + 16 = 62
    expect(groupHeight(5, "stacked", 30)).toBe(62);
  });
});

describe("contentHeight", () => {
  it("multi-row: rowCount * groupHeight", () => {
    expect(contentHeight(4, 108)).toBe(432);
  });
  it("single-row applies the 80px floor when the group is shorter", () => {
    expect(contentHeight(1, 56)).toBe(80);
  });
  it("single-row keeps the group height when it exceeds the floor", () => {
    expect(contentHeight(1, 108)).toBe(108);
  });
  it("empty → 0 regardless of groupHeight", () => {
    expect(contentHeight(0, 108)).toBe(0);
  });
});

describe("verticalPadding", () => {
  it("content fits → padding halved to center it", () => {
    expect(verticalPadding(200, 336)).toEqual({ top: 68, bottom: 68 });
  });
  it("content overflows → fixed {10, 10}", () => {
    expect(verticalPadding(500, 336)).toEqual({ top: 10, bottom: 10 });
  });
  it("exact fit → {0, 0}", () => {
    expect(verticalPadding(336, 336)).toEqual({ top: 0, bottom: 0 });
  });
});

describe("rowOffsets", () => {
  it("cumulative y per category, shifted by topPad", () => {
    expect(rowOffsets(3, 108, 68)).toEqual([68, 176, 284]);
  });
  it("topPad of 0 starts at the origin", () => {
    expect(rowOffsets(2, 56, 0)).toEqual([0, 56]);
  });
  it("empty → []", () => {
    expect(rowOffsets(0, 108, 68)).toEqual([]);
  });
});

describe("snapPositions", () => {
  it("one position per category: [0, g, 2g, …]", () => {
    expect(snapPositions(3, 108)).toEqual([0, 108, 216]);
  });
  it("single category → [0]", () => {
    expect(snapPositions(1, 108)).toEqual([0]);
  });
  it("empty → [0]", () => {
    expect(snapPositions(0, 108)).toEqual([0]);
  });
});

describe("nearestSnap", () => {
  const positions = [0, 108, 216, 324];

  it("current at 0, up clamps at the first index", () => {
    expect(nearestSnap(positions, 0, "up")).toBe(0);
  });
  it("current at 0, down steps to the next index", () => {
    expect(nearestSnap(positions, 0, "down")).toBe(1);
  });
  it("current exactly on a snap, up steps back one", () => {
    expect(nearestSnap(positions, 216, "up")).toBe(1);
  });
  it("current exactly on a snap, down steps forward one", () => {
    expect(nearestSnap(positions, 216, "down")).toBe(3);
  });
  it("current between snaps, up goes to the enclosing index", () => {
    // 108 <= 150 < 216 → idx 1; up → 0
    expect(nearestSnap(positions, 150, "up")).toBe(0);
  });
  it("current between snaps, down goes past the enclosing index", () => {
    // idx 1; down → 2
    expect(nearestSnap(positions, 150, "down")).toBe(2);
  });
  it("current past the last snap, up steps back from the end", () => {
    expect(nearestSnap(positions, 500, "up")).toBe(2);
  });
  it("current past the last snap, down clamps at the last index", () => {
    expect(nearestSnap(positions, 500, "down")).toBe(3);
  });
  it("down clamps at the last index when already there", () => {
    expect(nearestSnap(positions, 324, "down")).toBe(3);
  });
});

describe("barValue", () => {
  it("passes a plain number through", () => {
    expect(barValue(42)).toBe(42);
  });
  it("coerces a numeric string", () => {
    expect(barValue("42")).toBe(42);
    expect(barValue("3.5")).toBeCloseTo(3.5);
  });
  it("keeps the sign of a negative value (unlike SegmentedBar)", () => {
    expect(barValue(-17)).toBe(-17);
    expect(barValue("-3.5")).toBeCloseTo(-3.5);
  });
  it("collapses NaN / non-numeric / undefined / null to 0", () => {
    expect(barValue(NaN)).toBe(0);
    expect(barValue("oops")).toBe(0);
    expect(barValue(undefined)).toBe(0);
    expect(barValue(null)).toBe(0);
  });
  it("collapses non-finite values to 0", () => {
    expect(barValue(Infinity)).toBe(0);
    expect(barValue(-Infinity)).toBe(0);
  });
  it("keeps zero as zero", () => {
    expect(barValue(0)).toBe(0);
  });
});

describe("valueDomain", () => {
  it("grouped all-positive: [0, max] with 0 always included", () => {
    const data = [
      { m: "Jan", a: 10, b: 40 },
      { m: "Feb", a: 30, b: 20 },
    ];
    expect(valueDomain(data, ["a", "b"], "grouped")).toEqual([0, 40]);
  });
  it("grouped mixed sign: global [min, max] across all series values", () => {
    const data = [
      { m: "Jan", a: -25, b: 60 },
      { m: "Feb", a: 10, b: -5 },
    ];
    expect(valueDomain(data, ["a", "b"], "grouped")).toEqual([-25, 60]);
  });
  it("grouped all-negative still includes 0 at the top", () => {
    const data = [
      { m: "Jan", a: -10 },
      { m: "Feb", a: -40 },
    ];
    expect(valueDomain(data, ["a"], "grouped")).toEqual([-40, 0]);
  });
  it("grouped all-zero → [0, 0]", () => {
    const data = [{ m: "Jan", a: 0, b: 0 }];
    expect(valueDomain(data, ["a", "b"], "grouped")).toEqual([0, 0]);
  });
  it("stacked sums positives rightward and negatives leftward per row", () => {
    const data = [
      { m: "Jan", a: 10, b: 40, c: 20 }, // posSum 70
      { m: "Feb", a: -15, b: -25, c: 5 }, // negSum -40, posSum 5
    ];
    expect(valueDomain(data, ["a", "b", "c"], "stacked")).toEqual([-40, 70]);
  });
  it("stacked domain differs from grouped for the same data (signed sums)", () => {
    const data = [{ m: "Jan", a: 30, b: 20 }];
    // grouped max is the largest single value (30); stacked max is the sum (50)
    expect(valueDomain(data, ["a", "b"], "grouped")).toEqual([0, 30]);
    expect(valueDomain(data, ["a", "b"], "stacked")).toEqual([0, 50]);
  });
  it("ignores non-numeric cells (coerced to 0 via barValue)", () => {
    const data = [{ m: "Jan", a: "oops", b: 25 }];
    expect(valueDomain(data, ["a", "b"], "grouped")).toEqual([0, 25]);
  });
  it("empty data → [0, 0]", () => {
    expect(valueDomain([], ["a", "b"], "grouped")).toEqual([0, 0]);
    expect(valueDomain([], ["a", "b"], "stacked")).toEqual([0, 0]);
  });
});

describe("stackSegments", () => {
  it("orders positives left→right from zero and flags the outermost", () => {
    const { positives, negatives } = stackSegments({ a: 10, b: 40, c: 20 }, ["a", "b", "c"]);
    expect(negatives).toEqual([]);
    expect(positives.map((s) => s.key)).toEqual(["a", "b", "c"]);
    expect(positives[0]).toMatchObject({
      key: "a",
      isFirst: true,
      isLast: false,
    });
    expect(positives[2]).toMatchObject({
      key: "c",
      isFirst: false,
      isLast: true,
    });
    expect(positives[1]).toMatchObject({ isFirst: false, isLast: false });
  });
  it("orders negatives from zero outward (leftward) and flags the outermost", () => {
    const { positives, negatives } = stackSegments({ a: -10, b: -40 }, ["a", "b"]);
    expect(positives).toEqual([]);
    expect(negatives.map((s) => s.key)).toEqual(["a", "b"]);
    expect(negatives[0]).toMatchObject({
      key: "a",
      isFirst: true,
      isLast: false,
    });
    expect(negatives[1]).toMatchObject({
      key: "b",
      isFirst: false,
      isLast: true,
    });
  });
  it("splits a mixed row: positives and negatives keyed and flagged independently", () => {
    const { positives, negatives } = stackSegments({ a: 10, b: -15, c: 20, d: -25 }, [
      "a",
      "b",
      "c",
      "d",
    ]);
    expect(positives.map((s) => s.key)).toEqual(["a", "c"]);
    expect(negatives.map((s) => s.key)).toEqual(["b", "d"]);
    // outermost of each sign group
    expect(positives.find((s) => s.isLast)?.key).toBe("c");
    expect(negatives.find((s) => s.isLast)?.key).toBe("d");
    expect(positives[0]).toMatchObject({ key: "a", isFirst: true });
    expect(negatives[0]).toMatchObject({ key: "b", isFirst: true });
  });
  it("a lone segment is both first and last in its group", () => {
    const { positives } = stackSegments({ a: 10 }, ["a"]);
    expect(positives[0]).toMatchObject({ isFirst: true, isLast: true });
  });
  it("zero-valued keys join the positive group (openui >= 0)", () => {
    const { positives, negatives } = stackSegments({ a: 0, b: -5 }, ["a", "b"]);
    expect(positives.map((s) => s.key)).toEqual(["a"]);
    expect(negatives.map((s) => s.key)).toEqual(["b"]);
  });
});

describe("radiusArray", () => {
  const r = BAR_RADIUS;

  it("grouped positive rounds the right end [0, r, r, 0]", () => {
    expect(radiusArray("grouped", r, false, false, false)).toEqual([0, r, r, 0]);
  });
  it("grouped negative rounds the left end [r, 0, 0, r]", () => {
    expect(radiusArray("grouped", r, false, false, true)).toEqual([r, 0, 0, r]);
  });
  it("stacked single segment (first && last) rounds like grouped positive", () => {
    expect(radiusArray("stacked", r, true, true, false)).toEqual([0, r, r, 0]);
  });
  it("stacked single segment negative rounds the left end", () => {
    expect(radiusArray("stacked", r, true, true, true)).toEqual([r, 0, 0, r]);
  });
  it("stacked outermost (last, not first) positive rounds its far right end", () => {
    expect(radiusArray("stacked", r, false, true, false)).toEqual([0, r, r, 0]);
  });
  it("stacked outermost negative rounds its far left end", () => {
    expect(radiusArray("stacked", r, false, true, true)).toEqual([r, 0, 0, r]);
  });
  it("stacked inner/first-but-not-last segment stays square", () => {
    expect(radiusArray("stacked", r, true, false, false)).toEqual([0, 0, 0, 0]);
    expect(radiusArray("stacked", r, false, false, true)).toEqual([0, 0, 0, 0]);
  });
});

describe("showInternalLine", () => {
  it("is false just below the threshold (7 < 8)", () => {
    expect(showInternalLine(7)).toBe(false);
  });
  it("is true exactly at the threshold (8)", () => {
    expect(showInternalLine(MIN_LINE_DIMENSION)).toBe(true);
  });
  it("is true above the threshold", () => {
    expect(showInternalLine(120)).toBe(true);
  });
  it("is false for a zero-width bar", () => {
    expect(showInternalLine(0)).toBe(false);
  });
});

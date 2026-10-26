import { describe, expect, it } from "vitest";
import { MIN_SEGMENT, segmentPath, shareAt, shareSpans } from "./shareGeometry";

describe("shareSpans", () => {
  it("splits the bar by value with a gap between parts", () => {
    expect([...shareSpans([1, 1], 102, 2)]).toEqual([0, 50, 52, 50]);
  });

  it("keeps a tiny part visible and takes the room from the widest", () => {
    const spans = shareSpans([1000, 1], 100, 2);
    expect(spans[3]).toBe(MIN_SEGMENT);
    expect(spans[1]! + 2 + spans[3]!).toBeCloseTo(100);
  });

  it("gives zero parts no width and no gap", () => {
    expect([...shareSpans([1, 0, 1], 102, 2)]).toEqual([0, 50, 52, 0, 52, 50]);
  });

  it("draws nothing for an empty whole", () => {
    expect([...shareSpans([0, 0], 100)]).toEqual([0, 0, 0, 0]);
  });
});

describe("shareAt", () => {
  const spans = shareSpans([1, 1], 102, 2);

  it("finds the part under a point", () => {
    expect(shareAt(spans, 10)).toBe(0);
    expect(shareAt(spans, 90)).toBe(1);
  });

  it("returns null past the ends", () => {
    expect(shareAt(spans, 200)).toBeNull();
  });
});

describe("segmentPath", () => {
  it("rounds only the requested ends", () => {
    expect(segmentPath(0, 20, 10, true, false, 4)).toBe("M4,0H20V10H4Q0,10 0,6V4Q0,0 4,0Z");
    expect(segmentPath(0, 20, 10, false, false, 4)).toBe("M0,0H20V10H0V0Z");
  });
});

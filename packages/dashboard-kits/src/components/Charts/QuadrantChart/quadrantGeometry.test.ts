import { describe, expect, it } from "vitest";
import {
  BUBBLE_STRIDE,
  median,
  packBubbles,
  placeLabels,
  quadrantNameBoxes,
  quadrantOf,
  yAxisLeft,
} from "./quadrantGeometry";

describe("median", () => {
  it("takes the middle value, or the mean of the middle two", () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 3, 2])).toBe(2.5);
  });
});

describe("quadrantOf", () => {
  it("splits at the medians", () => {
    expect(quadrantOf({ x: 80, y: 4 }, 50, 2)).toBe("highHigh");
    expect(quadrantOf({ x: 20, y: 4 }, 50, 2)).toBe("lowHigh");
    expect(quadrantOf({ x: 80, y: 1 }, 50, 2)).toBe("highLow");
    expect(quadrantOf({ x: 20, y: 1 }, 50, 2)).toBe("lowLow");
  });
});

describe("placeLabels", () => {
  it("leaves a label off when every spot would cover another, keeping the bigger bubble's", () => {
    // Six bubbles on one point: four spots around it, so two labels can't fit.
    const crowd = [8, 20, 8, 8, 8, 8].map((r, i) => ({ cx: 200, cy: 100, r, label: `Point ${i}` }));
    const labels = placeLabels(crowd, { left: 0, right: 400 });
    expect(labels[1]).toBeDefined();
    expect(labels.some((l) => l === undefined)).toBe(true);
  });

  it("puts a lone label to the right of its bubble", () => {
    const [p] = placeLabels([{ cx: 100, cy: 100, r: 8, label: "Docs" }], { left: 0, right: 400 });
    expect(p?.anchor).toBe("start");
    expect(p!.x).toBeGreaterThan(108);
  });

  it("moves a label off a neighbouring bubble", () => {
    const [, second] = placeLabels(
      [
        { cx: 150, cy: 100, r: 8, label: "Right neighbour" },
        { cx: 120, cy: 100, r: 8, label: "Docs" },
      ],
      { left: 0, right: 400 },
    );
    expect(second?.anchor).not.toBe("start");
  });

  it("keeps a label off a reserved box, such as a quadrant name", () => {
    const bubble = { cx: 100, cy: 100, r: 8, label: "Docs" };
    const [free] = placeLabels([bubble], { left: 0, right: 400 });
    expect(free?.anchor).toBe("start");
    const [moved] = placeLabels([bubble], { left: 0, right: 400 }, undefined, [
      { x1: 105, y1: 90, x2: 200, y2: 110 },
    ]);
    expect(moved?.anchor).toBe("end");
  });

  it("keeps a label above the bottom bound, clear of the x tick labels", () => {
    // Right and left are blocked, so only above or below remain; below is past the bound.
    const bubbles = [
      { cx: 100, cy: 290, r: 8, label: "Low point" },
      { cx: 160, cy: 290, r: 8, label: "Neighbour" },
      { cx: 40, cy: 290, r: 8, label: "Other" },
    ];
    const [low] = placeLabels(bubbles, { left: 0, right: 400, top: 0, bottom: 300 });
    expect(low?.anchor).toBe("middle");
    expect(low!.y).toBeLessThan(290);
  });

  it("flips a label left at the right edge", () => {
    const [p] = placeLabels([{ cx: 390, cy: 100, r: 8, label: "Edge" }], { left: 0, right: 400 });
    expect(p?.anchor).toBe("end");
  });
});

describe("yAxisLeft", () => {
  it("widens the left edge for long tick labels and keeps the minimum for short ones", () => {
    expect(yAxisLeft(["0%", "6%"], 44)).toBe(44);
    expect(yAxisLeft(["45%", "70%"], 44)).toBeGreaterThan(48);
    expect(yAxisLeft(["100%"], 44)).toBeGreaterThan(yAxisLeft(["70%"], 44));
  });
});

describe("quadrantNameBoxes", () => {
  it("puts each name box in its corner of the plot", () => {
    const boxes = quadrantNameBoxes(
      { highHigh: "Winners", lowHigh: "Push", highLow: "Volume", lowLow: "Review" },
      { left: 50, right: 400, top: 16, bottom: 300 },
    );
    expect(boxes[0]!.x2).toBe(394);
    expect(boxes[1]!.x1).toBe(58);
    expect(boxes[2]!.y2).toBe(295);
    expect(boxes[3]!.y1).toBe(281);
  });
});

describe("packBubbles", () => {
  it("lays out each bubble and its label at the stride, the centre where unlabeled", () => {
    const flat = packBubbles(
      [
        { cx: 1, cy: 2, r: 3, label: "a" },
        { cx: 4, cy: 5, r: 6, label: "b" },
      ],
      [{ x: 7, y: 8, anchor: "start" }, undefined],
    );
    expect(flat.length).toBe(2 * BUBBLE_STRIDE);
    expect([...flat.subarray(0, 5)]).toEqual([1, 2, 3, 7, 8]);
    // Finite, so the morph can settle (NaN never reaches its rest threshold).
    expect([...flat.subarray(5, 10)]).toEqual([4, 5, 6, 4, 5]);
  });
});

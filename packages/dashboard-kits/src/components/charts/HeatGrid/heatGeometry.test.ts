import { describe, expect, it } from "vitest";
import { cellAt, heatMix, heatStep } from "./heatGeometry";

describe("heatStep", () => {
  it("quantizes against the busiest cell", () => {
    expect(heatStep(100, 100, 7)).toBe(7);
    expect(heatStep(50, 100, 7)).toBe(4);
    expect(heatStep(1, 100, 7)).toBe(1);
  });

  it("keeps zero, negatives, and a zero max at step 0", () => {
    expect(heatStep(0, 100)).toBe(0);
    expect(heatStep(-3, 100)).toBe(0);
    expect(heatStep(5, 0)).toBe(0);
  });
});

describe("heatMix", () => {
  it("runs from a light first step to the full color", () => {
    expect(heatMix(0, 7)).toBe(0);
    expect(heatMix(1, 7)).toBe(12);
    expect(heatMix(7, 7)).toBe(100);
  });
});

describe("cellAt", () => {
  const grid = { left: 40, top: 0, cellWidth: 10, cellHeight: 20, rows: 7, cols: 24 };

  it("finds the row and column under a point", () => {
    expect(cellAt(45, 25, grid)).toEqual({ row: 1, col: 0 });
    expect(cellAt(279, 139, grid)).toEqual({ row: 6, col: 23 });
  });

  it("returns null outside the grid", () => {
    expect(cellAt(39, 5, grid)).toBeNull();
    expect(cellAt(280, 5, grid)).toBeNull();
    expect(cellAt(50, 140, grid)).toBeNull();
  });
});

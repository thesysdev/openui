import { describe, expect, it } from "vitest";
import { cellStaggerDelayMs, cellStaggerRatio } from "./staggerSeed";

describe("cellStaggerRatio", () => {
  // Brief: cellStaggerRatio(3,2) twice → identical (deterministic).
  it("is deterministic for a given (col,row)", () => {
    expect(cellStaggerRatio(3, 2)).toBe(cellStaggerRatio(3, 2));
    expect(cellStaggerRatio(0, 0)).toBe(cellStaggerRatio(0, 0));
  });

  it("returns a value in [0,1)", () => {
    for (let col = 0; col < 20; col++) {
      for (let row = 0; row < 7; row++) {
        const value = cellStaggerRatio(col, row);
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(1);
      }
    }
  });

  // Brief: values across a 7x20 grid spread over [0,1) with >50 distinct values.
  it("spreads across a 7x20 grid with >50 distinct values", () => {
    const seen = new Set<number>();
    for (let col = 0; col < 20; col++) {
      for (let row = 0; row < 7; row++) {
        seen.add(cellStaggerRatio(col, row));
      }
    }
    expect(seen.size).toBeGreaterThan(50);
  });

  it("varies with col and with row (seed combines both axes)", () => {
    expect(cellStaggerRatio(3, 2)).not.toBe(cellStaggerRatio(4, 2));
    expect(cellStaggerRatio(3, 2)).not.toBe(cellStaggerRatio(3, 3));
  });
});

describe("cellStaggerDelayMs", () => {
  it("scales the ratio by duration and the default 0.6 spread", () => {
    const duration = 1000;
    expect(cellStaggerDelayMs(3, 2, duration)).toBeCloseTo(cellStaggerRatio(3, 2) * duration * 0.6);
  });

  it("honors a custom spread", () => {
    const duration = 1000;
    expect(cellStaggerDelayMs(3, 2, duration, 0.3)).toBeCloseTo(
      cellStaggerRatio(3, 2) * duration * 0.3,
    );
  });

  it("stays within [0, duration*spread) across the grid", () => {
    const duration = 1600;
    for (let col = 0; col < 20; col++) {
      for (let row = 0; row < 7; row++) {
        const delay = cellStaggerDelayMs(col, row, duration);
        expect(delay).toBeGreaterThanOrEqual(0);
        expect(delay).toBeLessThan(duration * 0.6);
      }
    }
  });
});

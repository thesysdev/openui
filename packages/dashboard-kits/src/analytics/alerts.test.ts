import { describe, expect, it } from "vitest";
import { deliveries, nOfM, runsOf } from "./alerts";

const T = true;
const F = false;

describe("nOfM", () => {
  it("is the plain rule at 1 of 1", () => {
    expect(nOfM([F, T, F, T], 1, 1)).toEqual([F, T, F, T]);
  });

  it("waits for 2 of the last 3 days", () => {
    expect(nOfM([T, F, T, T, F, T], 2, 3)).toEqual([F, F, T, T, T, T]);
  });
});

describe("runsOf", () => {
  it("joins consecutive days into one alert", () => {
    expect(runsOf([F, T, T, F, T])).toEqual([
      [1, 2],
      [4, 4],
    ]);
  });
});

describe("deliveries", () => {
  // Day 0 is a Thursday: 0 Thu, 1 Fri, 2 Sat, 3 Sun, 4 Mon.
  const weekday = (i: number) => (4 + i) % 7;

  it("sends at once without quiet weekends", () => {
    expect(deliveries([[2, 2]], weekday, false)).toEqual([{ run: [2, 2], day: 2, held: false }]);
  });

  it("holds a Saturday or Sunday start to Monday, and merges alerts that land together", () => {
    expect(
      deliveries(
        [
          [2, 2],
          [3, 3],
        ],
        weekday,
        true,
      ),
    ).toEqual([{ run: [2, 3], day: 4, held: true }]);
  });
});

import { describe, expect, it } from "vitest";
import { burnGeometry } from "./burnGeometry";

describe("burnGeometry", () => {
  const g = burnGeometry({
    burn: [100, 200, 300],
    committed: 1200,
    elapsed: 0.25,
    projected: 1200,
  });

  it("spreads the months so far over the share of the term gone", () => {
    expect(g.used).toEqual([
      [0, 0],
      [0.25 / 3, 100],
      [0.5 / 3, 200],
      [0.25, 300],
    ]);
  });

  it("runs the ideal line to the commit and the projection from today to renewal", () => {
    expect(g.ideal.at(-1)).toEqual([1, 1200]);
    expect(g.projected).toEqual([
      [0.25, 300],
      [1, 1200],
    ]);
  });

  it("fits the top to the larger of the commit and the projection", () => {
    expect(burnGeometry({ burn: [800], committed: 1000, elapsed: 0.5, projected: 1600 }).top).toBe(
      1600,
    );
  });
});

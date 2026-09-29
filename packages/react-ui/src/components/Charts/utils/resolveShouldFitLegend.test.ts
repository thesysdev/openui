import { describe, expect, it } from "vitest";
import { resolveShouldFitLegend } from "./resolveShouldFitLegend";

describe("resolveShouldFitLegend", () => {
  it("honors an explicit fitLegendInHeight regardless of height", () => {
    expect(resolveShouldFitLegend(true, undefined)).toBe(true);
    expect(resolveShouldFitLegend(false, 400)).toBe(false);
  });

  it("defaults to fit when a height is pinned, not when it is auto", () => {
    expect(resolveShouldFitLegend(undefined, 400)).toBe(true);
    expect(resolveShouldFitLegend(undefined, undefined)).toBe(false);
  });

  it('treats a pinned height of 0 or "" as explicit — the R10 fix', () => {
    // The cartesian outlier used `?? !!height`, which wrongly collapsed these to
    // false; `?? height !== undefined` keeps an explicitly pinned 0/"" as "fit".
    expect(resolveShouldFitLegend(undefined, 0)).toBe(true);
    expect(resolveShouldFitLegend(undefined, "")).toBe(true);
  });
});

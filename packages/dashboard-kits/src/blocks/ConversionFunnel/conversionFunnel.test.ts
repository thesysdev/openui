import { describe, expect, it } from "vitest";
import { funnelFocus } from "./ConversionFunnel";

describe("funnelFocus", () => {
  const step = (label: string, value: number, previous?: number) => ({ label, value, previous });

  it("picks the step whose rate fell most against the prior period", () => {
    const focus = funnelFocus([
      step("Sessions", 1000, 1000),
      step("Cart", 300, 320),
      step("Checkout", 120, 160),
      step("Purchase", 100, 130),
    ]);
    expect(focus).toEqual({ index: 2, kind: "fell", points: expect.closeTo(-10, 5) });
  });

  it("falls back to the biggest leak when nothing fell", () => {
    expect(funnelFocus([step("A", 1000), step("B", 600), step("C", 60), step("D", 50)])).toEqual({
      index: 2,
      kind: "leak",
    });
  });

  it("has nothing to say about a two-step funnel", () => {
    expect(funnelFocus([step("A", 10), step("B", 5)])).toBeUndefined();
  });
});

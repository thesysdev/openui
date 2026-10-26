import { describe, expect, it } from "vitest";
import { DASH_ARRAYS, linePatterns } from "./linePatterns";

describe("linePatterns", () => {
  it("leaves one or two strong series to color alone", () => {
    expect(linePatterns([])).toBeNull();
    expect(linePatterns([{}])).toBeNull();
    expect(linePatterns([{}, {}])).toBeNull();
    expect(linePatterns([{}, {}, { emphasis: "muted" }])).toBeNull();
    expect(linePatterns([{ emphasis: "primary" }, {}, { dashed: true }])).toBeNull();
  });

  it("gives three or more strong series solid, long, short, then dot-dash", () => {
    expect(linePatterns([{}, {}, {}])).toEqual(["solid", "long", "short"]);
    expect(linePatterns([{ emphasis: "primary" }, {}, {}, {}])).toEqual([
      "solid",
      "long",
      "short",
      "dotDash",
    ]);
  });

  it("keeps muted and dashed series on the context dash, skipping them in the order", () => {
    expect(linePatterns([{}, { emphasis: "muted" }, {}, { dashed: true }, {}])).toEqual([
      "solid",
      "context",
      "long",
      "context",
      "short",
    ]);
  });

  it("never gives a strong series the context dash", () => {
    const strong = (["solid", "long", "short", "dotDash"] as const).map((p) => DASH_ARRAYS[p]);
    expect(new Set(strong).size).toBe(strong.length);
    expect(strong).not.toContain(DASH_ARRAYS.context);
    expect(DASH_ARRAYS.context).toBe("4 4");
    expect(DASH_ARRAYS.solid).toBeUndefined();
  });
});

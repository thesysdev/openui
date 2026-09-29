import { describe, expect, it } from "vitest";
import { verticalBarRadii } from "./verticalBarRadii";

describe("verticalBarRadii", () => {
  it("positive rounded → rounds the TOP two corners [r, r, 0, 0]", () => {
    expect(verticalBarRadii(4, false, true)).toEqual([4, 4, 0, 0]);
  });
  it("negative rounded → rounds the BOTTOM two corners [0, 0, r, r]", () => {
    expect(verticalBarRadii(4, true, true)).toEqual([0, 0, 4, 4]);
  });
  it("not rounded → all zero regardless of sign", () => {
    expect(verticalBarRadii(4, false, false)).toEqual([0, 0, 0, 0]);
    expect(verticalBarRadii(4, true, false)).toEqual([0, 0, 0, 0]);
  });
});

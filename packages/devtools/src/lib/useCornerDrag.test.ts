import { describe, expect, it } from "vitest";
import { cornerAt } from "./useCornerDrag";

describe("cornerAt", () => {
  it("maps each viewport quadrant to its corner", () => {
    expect(cornerAt(10, 10, 1000, 800)).toBe("top-left");
    expect(cornerAt(990, 10, 1000, 800)).toBe("top-right");
    expect(cornerAt(10, 790, 1000, 800)).toBe("bottom-left");
    expect(cornerAt(990, 790, 1000, 800)).toBe("bottom-right");
  });
});

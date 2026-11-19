import { describe, expect, it } from "vitest";
import { cornerToward } from "./useCornerDrag";

describe("cornerToward", () => {
  it("switches the axis a short drag heads along", () => {
    expect(cornerToward("bottom-right", -10, 0)).toBe("bottom-left");
    expect(cornerToward("bottom-right", 0, -10)).toBe("top-right");
    expect(cornerToward("top-left", 10, 0)).toBe("top-right");
    expect(cornerToward("top-left", 0, 10)).toBe("bottom-left");
  });

  it("switches both axes on a diagonal drag", () => {
    expect(cornerToward("bottom-right", -10, -10)).toBe("top-left");
    expect(cornerToward("top-left", 10, 10)).toBe("bottom-right");
  });

  it("ignores the minor axis of a mostly straight drag", () => {
    expect(cornerToward("bottom-right", -10, -3)).toBe("bottom-left");
    expect(cornerToward("bottom-right", -3, -10)).toBe("top-right");
  });

  it("stays put when dragged toward the edge it is on", () => {
    expect(cornerToward("bottom-right", 10, 10)).toBe("bottom-right");
    expect(cornerToward("top-left", -5, -8)).toBe("top-left");
  });
});

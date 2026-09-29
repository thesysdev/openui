import { describe, expect, it } from "vitest";
import { entranceProps } from "./entranceUtils";

describe("entranceProps (painter entrance stagger)", () => {
  it("applies the modifier class and formats the delay when animating", () => {
    expect(entranceProps(true, "c1-x--animated", 120)).toEqual({
      className: "c1-x--animated",
      animationDelay: "120ms",
    });
  });

  it("drops the class and the delay when not animating", () => {
    expect(entranceProps(false, "c1-x--animated", 120)).toEqual({
      className: "",
      animationDelay: undefined,
    });
  });

  it("treats undefined animate as off (BarSeries passes an optional flag)", () => {
    expect(entranceProps(undefined, "c1-x--animated", 120)).toEqual({
      className: "",
      animationDelay: undefined,
    });
  });

  it("formats a zero delay as 0ms, not undefined (the first element animates)", () => {
    expect(entranceProps(true, "c1-x--animated", 0)).toEqual({
      className: "c1-x--animated",
      animationDelay: "0ms",
    });
  });

  it("passes the caller-computed delay through verbatim (basis/cap stay in the caller)", () => {
    // e.g. heatmap's capped Math.min(col * 15, 300) arrives here already clamped
    expect(entranceProps(true, "c", 300).animationDelay).toBe("300ms");
  });
});

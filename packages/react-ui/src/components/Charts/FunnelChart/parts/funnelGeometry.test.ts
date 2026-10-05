import { describe, expect, it } from "vitest";
import {
  formatFunnelPercentage,
  funnelHaloRamp,
  funnelPercentage,
  hSegmentPath,
  vSegmentPath,
} from "./funnelGeometry";

describe("funnelHaloRamp", () => {
  it("default 3 layers: outermost-first, the bklit opacity ramp", () => {
    const rings = funnelHaloRamp(3);
    expect(rings.map((r) => r.ringOpacity)).toEqual([
      0.18,
      0.18 + (1 / 2) * 0.65, // 0.505
      0.18 + (2 / 2) * 0.65, // 0.83
    ]);
    // Outermost (index 0) is the largest scale; the core (last) is full size.
    expect(rings[0]!.layerScale).toBe(1);
    expect(rings[2]!.layerScale).toBeCloseTo(1 - (2 / 3) * 0.35);
    // Core is the most opaque.
    expect(rings[2]!.ringOpacity).toBeGreaterThan(rings[0]!.ringOpacity);
  });

  it("single layer is fully opaque (not the raw 0.18 floor)", () => {
    const rings = funnelHaloRamp(1);
    expect(rings).toHaveLength(1);
    expect(rings[0]!.ringOpacity).toBe(1);
    expect(rings[0]!.layerScale).toBe(1);
  });

  it("clamps and rounds the layer count to >= 1", () => {
    expect(funnelHaloRamp(0)).toHaveLength(1);
    expect(funnelHaloRamp(-5)).toHaveLength(1);
    expect(funnelHaloRamp(2.6)).toHaveLength(3);
  });
});

describe("funnelPercentage (relative to first stage)", () => {
  it("first stage is always 100%", () => {
    expect(funnelPercentage(1000, 1000)).toBe(100);
  });

  it("downstream stages are retention vs the first", () => {
    expect(funnelPercentage(250, 1000)).toBe(25);
  });

  it("non-monotonic data can exceed 100% (informative, not clamped)", () => {
    expect(funnelPercentage(1200, 1000)).toBe(120);
  });

  it("guards a zero / non-finite reference", () => {
    expect(funnelPercentage(50, 0)).toBe(0);
    expect(funnelPercentage(50, Number.NaN)).toBe(0);
  });
});

describe("segment paths", () => {
  it("horizontal curved path tapers between the two norms", () => {
    // normStart 1 (full), normEnd 0.5, segW 100, H 200, layerScale 1.
    // my = 100; h0 = 1*200*0.44 = 88; h1 = 0.5*200*0.44 = 44.
    const d = hSegmentPath(1, 0.5, 100, 200, 1, false);
    expect(d.startsWith("M 0 12")).toBe(true); // my - h0 = 100 - 88 = 12
    expect(d).toContain("C"); // curved → has bezier commands
    expect(d.endsWith("Z")).toBe(true);
  });

  it("horizontal straight path uses only line commands", () => {
    const d = hSegmentPath(1, 0.5, 100, 200, 1, true);
    expect(d).not.toContain("C");
    // Top-right corner: x=segW=100, y=my-h1 = 100-44 = 56.
    expect(d).toContain("L 100 56");
    expect(d.endsWith("Z")).toBe(true);
  });

  it("vertical path swaps the taper onto the cross axis", () => {
    // normStart 1, normEnd 0.5, segH 100, W 200, layerScale 1.
    // mx = 100; w0 = 88; w1 = 44.
    const d = vSegmentPath(1, 0.5, 100, 200, 1, false);
    expect(d.startsWith("M 12 0")).toBe(true); // mx - w0 = 12, top edge y=0
    expect(d).toContain("C");
    expect(d.endsWith("Z")).toBe(true);
  });

  it("a degenerate (zero) norm collapses to a flat line, never NaN", () => {
    const d = hSegmentPath(0, 0, 100, 200, 1, false);
    expect(d).not.toContain("NaN");
    expect(d).toContain("M 0 100"); // both half-heights 0 → centered
  });

  it("layerScale shrinks the cross-axis extent", () => {
    const full = hSegmentPath(1, 1, 100, 200, 1, true);
    const inner = hSegmentPath(1, 1, 100, 200, 0.5, true);
    // full: h0 = 88 → top at 12; inner: h0 = 44 → top at 56 (closer to center)
    expect(full).toContain("M 0 12");
    expect(inner).toContain("M 0 56");
  });
});

describe("formatFunnelPercentage", () => {
  it("rounds to whole percentages", () => {
    expect(formatFunnelPercentage(100)).toBe("100%");
    expect(formatFunnelPercentage(26.4)).toBe("26%");
    expect(formatFunnelPercentage(0.5)).toBe("1%");
  });

  it("reads a non-empty stage that rounds to zero as <1%", () => {
    expect(formatFunnelPercentage(0.39)).toBe("<1%");
    expect(formatFunnelPercentage(0)).toBe("0%");
  });
});

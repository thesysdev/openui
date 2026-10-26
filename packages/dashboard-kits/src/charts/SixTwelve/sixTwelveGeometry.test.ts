import { describe, expect, it } from "vitest";
import { panelDomain, panelSpans } from "./sixTwelveGeometry";

describe("panelDomain", () => {
  it("covers this year, last year, and the plan with headroom", () => {
    const [from, to] = panelDomain({ labels: [], current: [80, 90], yearAgo: [50], plan: [100] });
    expect(from).toBeLessThan(50);
    expect(to).toBeCloseTo(105);
  });

  it("starts at zero when the values sit near it", () => {
    expect(panelDomain({ labels: [], current: [2, 10], yearAgo: [1] })[0]).toBe(0);
  });

  it("keeps a narrow range off zero so small moves show", () => {
    expect(panelDomain({ labels: [], current: [28.1, 29.4], yearAgo: [27.9] })[0]).toBeGreaterThan(
      27,
    );
  });
});

describe("panelSpans", () => {
  it("gives the weeks a third and the months the rest", () => {
    expect(panelSpans(320, 20)).toEqual({ weeks: [0, 100], months: [120, 320] });
  });
});

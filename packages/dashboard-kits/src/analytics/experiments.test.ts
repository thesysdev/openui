import { describe, expect, it } from "vitest";
import { guardrailLight, liftOf, normalCdf, readOdds, sampleRatio } from "./experiments";

describe("normalCdf", () => {
  it("matches the table", () => {
    expect(normalCdf(0)).toBeCloseTo(0.5, 6);
    expect(normalCdf(1.96)).toBeCloseTo(0.975, 3);
    expect(normalCdf(-1.645)).toBeCloseTo(0.05, 3);
  });
});

describe("liftOf", () => {
  it("computes the checklist test's interval from its counts", () => {
    // 12,410 at 31.2% against 12,388 at 34.6%: the plan's worked check gives 6.9% to 14.8%.
    const l = liftOf({ users: 12410, conversions: 3872 }, { users: 12388, conversions: 4286 });
    expect(l.lift).toBeCloseTo(0.109, 2);
    expect(l.low).toBeCloseTo(0.069, 2);
    expect(l.high).toBeCloseTo(0.148, 2);
    expect(l.p).toBeLessThan(0.001);
  });
});

describe("sampleRatio", () => {
  it("passes an even split and flags 52/48 at this size", () => {
    expect(sampleRatio([5010, 4990], [0.5, 0.5]).ok).toBe(true);
    expect(sampleRatio([10840, 10008], [0.5, 0.5]).ok).toBe(false);
  });
});

describe("guardrailLight", () => {
  const allowed = 0.02;
  it("is grey when the whole interval is safe, yellow when it crosses, red when the estimate is worse", () => {
    expect(guardrailLight({ lift: -0.005, low: -0.01, high: 0.0 }, allowed, true)).toBe("grey");
    expect(guardrailLight({ lift: 0.01, low: -0.01, high: 0.03 }, allowed, true)).toBe("yellow");
    expect(guardrailLight({ lift: 0.03, low: 0.01, high: 0.05 }, allowed, true)).toBe("red");
    expect(guardrailLight({ lift: -0.03, low: -0.05, high: -0.01 }, allowed, false)).toBe("red");
  });
});

describe("readOdds", () => {
  it("reads the chance of beating control off the interval", () => {
    expect(readOdds(0, -2, 2, 10).chanceBetter).toBeCloseTo(0.5, 6);
    // An interval with its low end on zero puts 97.5% of the spread above it.
    expect(readOdds(3, 0, 6, 10).chanceBetter).toBeCloseTo(0.975, 3);
  });

  it("says how much longer an unclear lift needs, and nothing once it is clear", () => {
    // z = 1: 80% power needs about 7.85 times the days run.
    const unclear = readOdds(1, -0.96, 2.96, 10);
    expect(unclear.moreDays).toBe(Math.ceil(10 * (2.8016 / 1) ** 2 - 10));
    expect(readOdds(3, 1, 5, 10).moreDays).toBeUndefined();
  });
});

import { describe, expect, it } from "vitest";
import { knee, score, tableFor } from "./moments";

describe("score", () => {
  it("matches a hand-worked 2×2 table", () => {
    const s = score({ a: 30, b: 10, c: 20, d: 40 });
    expect(s.reach).toBeCloseTo(0.4);
    expect(s.precision).toBeCloseTo(0.75);
    expect(s.recall).toBeCloseTo(0.6);
    // (30·40 − 10·20) ÷ √(40 · 60 · 50 · 50) = 1000 ÷ 2449.5
    expect(s.phi).toBeCloseTo(0.4082, 3);
  });

  it("gives zero phi when the behaviour says nothing", () => {
    expect(score({ a: 25, b: 25, c: 25, d: 25 }).phi).toBe(0);
  });
});

describe("tableFor", () => {
  it("adds up to everyone and recovers the latent split when the behaviour is the aha", () => {
    const t = tableFor(1000, 0.2, { activated: 1, rest: 0 }, { activated: 0.7, rest: 0.15 });
    expect(t.a + t.b + t.c + t.d).toBeCloseTo(1000);
    expect(score(t).reach).toBeCloseTo(0.2);
    expect(score(t).precision).toBeCloseTo(0.7);
  });
});

describe("knee", () => {
  it("finds where one more repetition stops adding two points", () => {
    expect(knee([0.3, 0.45, 0.55, 0.56, 0.565])).toBe(3);
    expect(knee([0.3, 0.4, 0.5])).toBe(3);
  });
});

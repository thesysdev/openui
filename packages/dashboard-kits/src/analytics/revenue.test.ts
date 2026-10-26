import { describe, expect, it } from "vitest";
import { addHistories, cohortNrr, pacing, quickRatio, retention, revenueHistory } from "./revenue";

describe("revenueHistory", () => {
  const history = revenueHistory("team", 100_000, 24);

  it("ends on today's MRR and chains each month into the next", () => {
    expect(history.at(-1)!.end).toBeCloseTo(100_000);
    for (let k = 1; k < history.length; k++) {
      expect(history[k]!.start).toBeCloseTo(history[k - 1]!.end);
    }
  });

  it("adds every movement up to the month's change", () => {
    for (const m of history) {
      const moved = m.new + m.expansion + m.reactivation - m.contraction - m.churn;
      expect(m.end - m.start).toBeCloseTo(moved);
    }
  });

  it("keeps GRR under 100% and under NRR", () => {
    const { nrr, grr } = retention(history, 23);
    expect(grr).toBeLessThan(1);
    expect(nrr).toBeGreaterThan(grr);
  });
});

describe("retention", () => {
  it("matches a hand-worked year of flat rates", () => {
    const flat = Array.from({ length: 12 }, () => ({
      start: 100,
      new: 3,
      expansion: 2,
      reactivation: 0,
      contraction: 0.5,
      churn: 0.5,
      end: 104,
    }));
    const { nrr, grr } = retention(flat, 11);
    expect(nrr).toBeCloseTo(1.01 ** 12);
    expect(grr).toBeCloseTo(0.99 ** 12);
    expect(quickRatio(flat[0]!)).toBeCloseTo(5);
  });
});

describe("addHistories", () => {
  it("adds plans month by month", () => {
    const team = revenueHistory("team", 60_000, 3);
    const business = revenueHistory("business", 40_000, 3);
    const both = addHistories([team, business]);
    expect(both[2]!.end).toBeCloseTo(100_000);
    expect(both[0]!.churn).toBeCloseTo(team[0]!.churn + business[0]!.churn);
  });
});

describe("cohortNrr", () => {
  it("starts each cohort at 100% and gives the newest the fewest months", () => {
    const rows = cohortNrr(revenueHistory("business", 50_000, 24), 12);
    expect(rows.length).toBe(12);
    rows.forEach((r) => expect(r[0]).toBe(1));
    expect(rows[0]!.length).toBe(12);
    expect(rows[11]!.length).toBe(1);
  });

  it("grows a Business cohort past 100% as teams add seats", () => {
    const [oldest] = cohortNrr(revenueHistory("business", 50_000, 24), 12);
    expect(oldest!.at(-1)).toBeGreaterThan(1);
  });
});

describe("pacing", () => {
  it("is on track when use follows a straight line through the term", () => {
    expect(pacing(5_000, 10_000, 0.5)).toEqual({ pace: 1, projected: 10_000, status: "on_track" });
  });

  it("flags under 80% and over 110%", () => {
    expect(pacing(3_000, 10_000, 0.5).status).toBe("under");
    expect(pacing(6_000, 10_000, 0.5).status).toBe("over");
    expect(pacing(4_000, 10_000, 0.5).status).toBe("on_track");
  });
});

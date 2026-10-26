import { describe, expect, it } from "vitest";
import {
  addPopulations,
  chanceAfter,
  cohortRetention,
  simulate,
  type PopulationInput,
} from "./population";

const WEEK = [1, 1, 1, 1, 1, 0.4, 0.4];
const input = (days: number, activation = 0.3): PopulationInput => ({
  signups: Array.from({ length: days }, () => 100),
  activation: Array.from({ length: days }, () => activation),
  activated: { yesterday: 0.78, decay: 0.86, floor: 0.003 },
  notActivated: { yesterday: 0.42, decay: 0.7, floor: 0.0015 },
  dayFactor: Array.from({ length: days }, (_, i) => WEEK[i % 7]!),
  warmup: 140,
});

describe("simulate", () => {
  const p = simulate(input(60));

  it("applies a what-if's bands only from bandsFrom", () => {
    const bands: [number, number, number] = [1.2, 1.2, 1.2];
    const boosted = (bandsFrom?: number) =>
      simulate({
        ...input(60),
        activated: { ...input(60).activated, bands },
        notActivated: { ...input(60).notActivated, bands },
        bandsFrom,
      });
    const late = boosted(40);
    for (let t = 0; t < 40; t++) expect(late.dau[t]).toBeCloseTo(p.dau[t]!, 9);
    expect(late.dau[45]).toBeGreaterThan(p.dau[45]!);
    // Boosted throughout, the population is bigger from the first day.
    expect(boosted().dau[0]).toBeGreaterThan(p.dau[0]!);
    expect(boosted().dau[59]).toBeGreaterThan(late.dau[59]!);
  });

  it("keeps the lifecycle identities every day", () => {
    for (let t = 0; t < p.days; t++) {
      expect(p.dau[t]).toBeCloseTo(
        p.newUsers[t]! + p.current[t]! + p.reactivated[t]! + p.resurrected[t]!,
      );
      expect(p.wau[t]).toBeCloseTo(p.dau[t]! + p.atRiskWau[t]!);
      expect(p.mau[t]).toBeCloseTo(p.wau[t]! + p.atRiskMau[t]!);
      expect(p.dau[t]).toBeLessThanOrEqual(p.wau[t]!);
      expect(p.wau[t]).toBeLessThanOrEqual(p.mau[t]!);
    }
  });

  it("dips on weekends and recovers on weekdays", () => {
    expect(p.dau[5]).toBeLessThan(p.dau[4]! * 0.7);
    expect(p.dau[7]).toBeGreaterThan(p.dau[6]! * 1.4);
  });

  it("grows when more signups activate", () => {
    const more = simulate(input(60, 0.45));
    expect(more.dau[59]).toBeGreaterThan(p.dau[59]!);
  });

  it("accounts for each week's actives as new, returning, or resurrecting", () => {
    // Weeks end on the last day (59), so week w ends on day 59 − 7w.
    for (const end of [59, 52, 45]) {
      const days = Array.from({ length: 7 }, (_, i) => end - 6 + i);
      const returning = days.reduce((t, d) => t + p.returning[d]!, 0);
      const fresh = days.reduce((t, d) => t + p.signups[d]!, 0);
      const resurrecting = p.wau[end]! - returning - fresh;
      expect(returning).toBeGreaterThan(0);
      expect(returning).toBeLessThanOrEqual(p.wau[end - 7]!);
      expect(resurrecting).toBeGreaterThan(0);
    }
  });

  it("adds segments field by field", () => {
    const sum = addPopulations([p, p]);
    expect(sum.wau[10]).toBeCloseTo(p.wau[10]! * 2);
    expect(sum.days).toBe(p.days);
  });
});

describe("cohortRetention", () => {
  const c = cohortRetention({
    signups: [100, 100, 100, 100, 100, 0, 0],
    activation: [0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3],
    activated: { yesterday: 0.78, decay: 0.86, floor: 0.003 },
    notActivated: { yesterday: 0.42, decay: 0.7, floor: 0.0015 },
    dayFactor: Array.from({ length: 42 }, (_, i) => WEEK[i % 7]!),
  });

  it("starts with everyone and falls week by week", () => {
    expect(c.size).toBe(500);
    expect(c.all[0]).toBeCloseTo(1);
    expect(c.all.length).toBe(6);
    for (let w = 1; w < c.all.length; w++)
      expect(c.all[w]).toBeLessThanOrEqual(c.all[w - 1]! + 1e-9);
  });

  it("counts unbounded retention at least as high as exact, and never rising", () => {
    c.unbounded.forEach((u, w) => {
      expect(u).toBeGreaterThanOrEqual(c.all[w]! - 1e-9);
      if (w) expect(u).toBeLessThanOrEqual(c.unbounded[w - 1]! + 1e-9);
    });
  });

  it("reads a one-week bracket as exact retention, and a wider one between exact and unbounded", () => {
    c.all.forEach((v, w) => expect(c.bracket(w, w)).toBeCloseTo(v));
    const wide = c.bracket(2, 4);
    expect(wide).toBeGreaterThanOrEqual(Math.max(c.all[2]!, c.all[3]!, c.all[4]!) - 1e-9);
    expect(wide).toBeLessThanOrEqual(c.unbounded[2]! + 1e-9);
    expect(c.bracket(2, 9)).toBeNaN();
  });

  it("has no week in progress when the span is whole weeks, and one when it is not", () => {
    expect(c.partial).toBeUndefined();
    const short = cohortRetention({
      signups: [100],
      activation: [0.3],
      activated: { yesterday: 0.78, decay: 0.86, floor: 0.003 },
      notActivated: { yesterday: 0.42, decay: 0.7, floor: 0.0015 },
      dayFactor: Array.from({ length: 10 }, () => 1),
    });
    expect(short.all.length).toBe(1);
    expect(short.partial).toBeGreaterThan(0);
    expect(short.partial).toBeLessThan(1);
  });

  it("keeps activated users at least twice as well by week 4", () => {
    expect(c.activated[4]! / c.notActivated[4]!).toBeGreaterThan(2);
  });
});

it("returns less the longer someone has been away, down to a floor", () => {
  const curve = { yesterday: 0.8, decay: 0.8, floor: 0.01 };
  expect(chanceAfter(curve, 1)).toBe(0.8);
  expect(chanceAfter(curve, 2)).toBeCloseTo(0.64);
  expect(chanceAfter(curve, 60)).toBe(0.01);
});

describe("simulate flow", () => {
  const days = 90;
  const p = simulate({ ...input(days), flowDays: 28 });
  const total = (key: "from" | "to", name: string) =>
    p.flow!.filter((l) => l[key] === name).reduce((a, l) => a + l.value, 0);

  it("ends with every user in the state they hold on the last day", () => {
    const last = days - 1;
    expect(total("to", "Weekly active")).toBeCloseTo(p.wau[last]!, 6);
    expect(total("to", "At risk")).toBeCloseTo(p.atRiskMau[last]!, 6);
  });

  it("starts with the states at the flow's start, plus signups since", () => {
    const start = days - 1 - 28;
    expect(total("from", "Weekly active")).toBeCloseTo(p.wau[start]!, 6);
    expect(total("from", "At risk")).toBeCloseTo(p.atRiskMau[start]!, 6);
    const signedUp = Array.from(p.signups.subarray(start + 1)).reduce((a, v) => a + v, 0);
    expect(total("from", "Signed up")).toBeCloseTo(signedUp, 6);
  });

  it("keeps the users: as many leave the left side as reach the right", () => {
    const sum = (key: "from" | "to") =>
      [...new Set(p.flow!.map((l) => l[key]))].reduce((a, n) => a + total(key, n), 0);
    expect(sum("from")).toBeCloseTo(sum("to"), 6);
  });
});

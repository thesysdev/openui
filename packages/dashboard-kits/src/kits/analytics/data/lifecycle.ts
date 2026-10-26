// The seven daily lifecycle states on the 28-day MAU, each state's return
// rate, and which rate, raised, would add the most daily actives.

import { dayLabels, mean, round, sum } from "../../../core/sample-data";
import type { Item } from "../../../core/schemas";
import { addPopulations, type Population } from "../population";
import { population, segmentPopulation, segments, take, type Boost } from "./activity";
import { HISTORY, ruleFor } from "./shared";

/**
 * The seven daily lifecycle states (Duolingo's model, on our 28-day MAU) for
 * the last 28 days: active users above the line by why they count, inactive
 * ones below by how long they have been away; each state's daily return rate;
 * and which rate, raised 2% for the last 90 days, would add the most daily
 * actives (in the last week).
 */
export function lifecycleStates(platform: string, plan: string) {
  const days = 28;
  const pop = population(platform, plan);
  const field = (values: Float64Array, sign = 1) =>
    take(values, days).map((v) => Math.round(v * sign));
  const rate = (came: Float64Array, from: Float64Array) =>
    sum(take(came, days)) / (sum(take(from, days, 1)) || 1);
  const lastWeek = (p: Population) => mean(take(p.dau, 7));
  const base = lastWeek(pop);
  const boosted = (boost: Boost) =>
    lastWeek(
      addPopulations(segments(platform, plan).map(([pf, pl]) => segmentPopulation(pf, pl, boost))),
    );
  const tests: [string, Boost][] = [
    ["Current users returning +2%", { bands: [1.02, 1, 1], activation: 1 }],
    ["Reactivation +2%", { bands: [1, 1.02, 1], activation: 1 }],
    ["Resurrection +2%", { bands: [1, 1, 1.02], activation: 1 }],
    ["New users activating +2%", { bands: [1, 1, 1], activation: 1.02 }],
  ];
  return {
    labels: dayLabels(days),
    newUsers: field(pop.newUsers),
    current: field(pop.current),
    reactivated: field(pop.reactivated),
    resurrected: field(pop.resurrected),
    // Reactivated and resurrected together, so a 4-series chart keeps at risk.
    cameBack: field(pop.reactivated).map((v, i) => v + field(pop.resurrected)[i]!),
    atRiskWau: field(pop.atRiskWau, -1),
    dormant: Math.round(pop.dormant[HISTORY - 1]!),
    rates: [
      { name: "Current: back within 6 days", value: round(rate(pop.current, pop.wau) * 100, 1) },
      {
        name: "Reactivated: back after 7–27 days",
        value: round(rate(pop.reactivated, pop.atRiskMau) * 100, 2),
      },
      {
        name: "Resurrected: back after 28+ days",
        value: round(rate(pop.resurrected, pop.dormant) * 100, 2),
      },
    ] as Item[],
    sensitivity: tests
      .map(([name, boost]) => ({ name, value: Math.round(boosted(boost) - base) }))
      .sort((a, b) => b.value - a.value) as Item[],
    // Where users were 28 days ago (or that they signed up since) and where
    // they are today. Users lapsed (away 90+ days) at both ends are left out:
    // years of past signups that would dwarf every move worth seeing.
    flow: (pop.flow ?? [])
      .filter((l) => !(l.from === "Lapsed" && l.to === "Lapsed"))
      .map((l) => ({ from: l.from, to: l.to, users: Math.round(l.value) }))
      .filter((l) => l.users > 0),
    rule: ruleFor("core", "daily states, last 28 days"),
  };
}

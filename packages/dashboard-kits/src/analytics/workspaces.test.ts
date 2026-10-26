import { describe, expect, it } from "vitest";
import {
  backTest,
  healthParts,
  healthScore,
  isAccountActive,
  isExpansionReady,
  isSlipping,
  PAYING_WORKSPACES,
  workspaces,
  zoneOf,
} from "./workspaces";

describe("healthScore", () => {
  it("weights the categories that have data", () => {
    expect(healthScore({ engagement: 100, seats: 0, breadth: 0, support: 0, trend: 0 })).toBe(35);
  });

  it("scales the other weights up when a category is blank", () => {
    const withSupport = healthScore({
      engagement: 80,
      seats: 80,
      breadth: 80,
      support: 0,
      trend: 80,
    });
    const without = healthScore({ engagement: 80, seats: 80, breadth: 80, trend: 80 });
    expect(withSupport).toBe(68);
    expect(without).toBe(80);
  });

  it("names the zones", () => {
    expect(zoneOf(70)).toBe("Healthy");
    expect(zoneOf(69)).toBe("Watch");
    expect(zoneOf(39)).toBe("At risk");
  });
});

describe("workspaces", () => {
  const list = workspaces();
  const named = (name: string) => list.find((w) => w.name === name)!;

  it("has every paying workspace, plus those that cancelled, with unique names", () => {
    expect(list.filter((w) => !w.churned).length).toBe(PAYING_WORKSPACES);
    expect(list.some((w) => w.churned)).toBe(true);
    expect(new Set(list.map((w) => w.name)).size).toBe(list.length);
  });

  it("keeps the named stories", () => {
    const harbor = named("Harbor & Pine");
    expect(harbor.scoreWeekAgo - healthScore(healthParts(harbor))).toBeGreaterThanOrEqual(15);
    expect(isSlipping(harbor)).toBe(true);
    expect(isExpansionReady(named("Kestrel Labs"))).toBe(true);
  });

  it("gives three different counts for the three account-active rules", () => {
    const counts = (["any", "team", "seats"] as const).map(
      (rule) => list.filter((w) => isAccountActive(w, rule)).length,
    );
    expect(new Set(counts).size).toBe(3);
  });

  it("shows low scores 90 days ago churning more", () => {
    const [low, , high] = backTest(list);
    expect(low!.rate).toBeGreaterThan(high!.rate * 3);
  });
});

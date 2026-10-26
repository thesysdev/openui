import { RANGE_DAYS, round, sum } from "../../core/sample-data";
import type { Range } from "../../core/schemas";
import { marketing } from "./marketing";
import { breakEvenRoas } from "./profit";

// Ad creatives: each ad's spend, ROAS, and fatigue, set against break-even.

const CREATIVES = [
  {
    name: "Trail Runner 2: hill sprint",
    platform: "meta",
    format: "Video",
    weight: 0.3,
    roas: 1.25,
    hook: 0.34,
    hold: 0.42,
    ctr: 0.0142,
    frequency: 2.1,
    trend: 0.04,
  },
  {
    name: "Merino layering carousel",
    platform: "meta",
    format: "Carousel",
    weight: 0.24,
    roas: 1.15,
    hook: 0,
    hold: 0,
    ctr: 0.0118,
    frequency: 2.6,
    trend: -0.06,
  },
  {
    name: "Founder story",
    platform: "meta",
    format: "Video",
    weight: 0.26,
    roas: 0.8,
    hook: 0.22,
    hold: 0.31,
    ctr: 0.0081,
    frequency: 4.4,
    trend: -0.31,
  },
  {
    name: "Fall sale static",
    platform: "meta",
    format: "Static",
    weight: 0.2,
    roas: 0.75,
    hook: 0,
    hold: 0,
    ctr: 0.0072,
    frequency: 3.9,
    trend: -0.24,
  },
  {
    name: "Unboxing with a creator",
    platform: "tiktok",
    format: "Video",
    weight: 0.45,
    roas: 1.3,
    hook: 0.41,
    hold: 0.28,
    ctr: 0.0109,
    frequency: 1.8,
    trend: 0.02,
  },
  {
    name: "Trend sound: tote packing",
    platform: "tiktok",
    format: "Video",
    weight: 0.55,
    roas: 0.75,
    hook: 0.29,
    hold: 0.17,
    ctr: 0.0064,
    frequency: 3.6,
    trend: -0.28,
  },
  {
    name: "Search: brand terms",
    platform: "google",
    format: "Search",
    weight: 0.35,
    roas: 1.6,
    hook: 0,
    hold: 0,
    ctr: 0.081,
    frequency: 0,
    trend: 0.01,
  },
  {
    name: "Shopping: footwear",
    platform: "google",
    format: "Shopping",
    weight: 0.4,
    roas: 0.85,
    hook: 0,
    hold: 0,
    ctr: 0.0124,
    frequency: 0,
    trend: -0.03,
  },
  {
    name: "Performance Max",
    platform: "google",
    format: "Mixed",
    weight: 0.25,
    roas: 0.6,
    hook: 0,
    hold: 0,
    ctr: 0.0091,
    frequency: 0,
    trend: -0.09,
  },
] as const;

/**
 * Each ad's share of its platform: spend by weight, revenue by weight times
 * its relative ROAS, scaled so each platform's ads add up to the platform's
 * spend and store-attributed revenue.
 */
export function creatives(range: Range, platform: string) {
  const days = RANGE_DAYS[range];
  const breakEven = breakEvenRoas(days);
  const channels = marketing(range).channels;
  return CREATIVES.filter((c) => platform === "all" || c.platform === platform).map((c) => {
    const ch = channels.find((x) => x.m.key === c.platform)!;
    const peers = CREATIVES.filter((x) => x.platform === c.platform);
    const spend = ch.spend * c.weight;
    const revenue = (ch.revenue * c.weight * c.roas) / sum(peers.map((x) => x.weight * x.roas));
    const roas = revenue / spend;
    const fatigued = c.frequency > 3.5 && c.trend < -0.2;
    return {
      name: c.name,
      platform: ch.m.label,
      format: c.format,
      spend: Math.round(spend),
      revenue: Math.round(revenue),
      roas: round(roas, 2),
      ctr: round(c.ctr, 4),
      ctrChange: round(c.trend * 100),
      ...(c.hook ? { hookRate: c.hook, holdRate: c.hold } : {}),
      ...(c.frequency ? { frequency: c.frequency } : {}),
      fatigue: fatigued
        ? ("Fatigued" as const)
        : c.trend < -0.05
          ? ("Watch" as const)
          : ("Fresh" as const),
      belowBreakEven: roas < breakEven,
    };
  });
}

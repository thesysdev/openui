import { describe, expect, it } from "vitest";
import { formatAxis, formatTicks } from "./format";

describe("formatTicks", () => {
  it("keeps the usual compact labels when they already differ", () => {
    expect(formatTicks([0, 20_000, 40_000], "currency")).toEqual(["$0", "$20K", "$40K"]);
  });

  it("adds decimals until close ticks read differently", () => {
    const ticks = [2_000_000, 2_020_000, 2_040_000, 2_060_000];
    expect(new Set(ticks.map((t) => formatAxis(t, "currency"))).size).toBeLessThan(ticks.length);
    expect(formatTicks(ticks, "currency")).toEqual(["$2M", "$2.02M", "$2.04M", "$2.06M"]);
  });
});

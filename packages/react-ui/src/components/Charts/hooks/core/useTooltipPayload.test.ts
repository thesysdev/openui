import { describe, expect, it } from "vitest";
import { tooltipPayloadEqual, type TooltipPayload } from "./useTooltipPayload";

const payload = (over: Partial<TooltipPayload> = {}): TooltipPayload => ({
  label: "Jan",
  items: [
    { name: "alpha", value: 10, color: "#111" },
    { name: "beta", value: 20, color: "#222" },
  ],
  ...over,
});

describe("tooltipPayloadEqual (the identity-stability key under streaming)", () => {
  it("equal content → equal (fresh objects, fresh items arrays)", () => {
    expect(tooltipPayloadEqual(payload(), payload())).toBe(true);
  });

  it("null handling: both null equal, one null not", () => {
    expect(tooltipPayloadEqual(null, null)).toBe(true);
    expect(tooltipPayloadEqual(payload(), null)).toBe(false);
    expect(tooltipPayloadEqual(null, payload())).toBe(false);
  });

  it("any changed field breaks equality", () => {
    expect(tooltipPayloadEqual(payload(), payload({ label: "Feb" }))).toBe(false);
    const changedValue = payload();
    changedValue.items[1] = { ...changedValue.items[1]!, value: 21 };
    expect(tooltipPayloadEqual(payload(), changedValue)).toBe(false);
    const changedColor = payload();
    changedColor.items[0] = { ...changedColor.items[0]!, color: "#333" };
    expect(tooltipPayloadEqual(payload(), changedColor)).toBe(false);
    const changedName = payload();
    changedName.items[0] = { ...changedName.items[0]!, name: "gamma" };
    expect(tooltipPayloadEqual(payload(), changedName)).toBe(false);
  });

  it("item count changes break equality", () => {
    const fewer = payload();
    fewer.items = fewer.items.slice(0, 1);
    expect(tooltipPayloadEqual(payload(), fewer)).toBe(false);
  });

  it('string values (heatmap "No value") compare by value', () => {
    const a = payload({
      items: [{ name: "a", value: "No value", color: "#1" }],
    });
    const b = payload({
      items: [{ name: "a", value: "No value", color: "#1" }],
    });
    expect(tooltipPayloadEqual(a, b)).toBe(true);
  });
});

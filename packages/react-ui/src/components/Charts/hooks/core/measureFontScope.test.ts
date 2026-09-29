import { describe, expect, it } from "vitest";
import { resolveMeasureFont } from "./measureFontScope";

describe("resolveMeasureFont", () => {
  it("prefers the CSS-var font (the render channel) over the theme token", () => {
    expect(
      resolveMeasureFont('400 20px/1.2 "Inter", system-ui, sans-serif', "400 12px/1.25 Inter"),
    ).toBe('400 20px/1.2 "Inter", system-ui, sans-serif');
  });

  it("trims whitespace from computed custom-property values", () => {
    // getComputedStyle().getPropertyValue preserves the declaration's leading
    // whitespace — ' 400 20px…' must not defeat the css-var branch.
    expect(resolveMeasureFont("  400 20px/1.2 Inter  ", "400 12px/1.25 Inter")).toBe(
      "400 20px/1.2 Inter",
    );
  });

  it("falls back to the theme token when no scope element resolved the var", () => {
    expect(resolveMeasureFont("", "400 14px/1.3 Inter")).toBe("400 14px/1.3 Inter");
    expect(resolveMeasureFont(null, "400 14px/1.3 Inter")).toBe("400 14px/1.3 Inter");
    expect(resolveMeasureFont(undefined, "400 14px/1.3 Inter")).toBe("400 14px/1.3 Inter");
  });

  it("falls back to the react-ui default when both channels are empty", () => {
    expect(resolveMeasureFont("", "")).toBe("400 12px/1.25 Inter");
    expect(resolveMeasureFont(null, undefined)).toBe("400 12px/1.25 Inter");
    expect(resolveMeasureFont("   ", "  ")).toBe("400 12px/1.25 Inter");
  });
});

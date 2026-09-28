import { describe, expect, it } from "vitest";
import type { ChartColorPalette } from "../../ThemeProvider";
import { getDistributedColors, OCEAN_DEFAULT, resolvePalette } from "./paletteUtils";

const bar = ["#b1", "#b2"];
const def = ["#d1", "#d2"];
const custom = ["#c1", "#c2"];

describe("resolvePalette (react-ui ChartColorPalette integration)", () => {
  it("customPalette overrides everything", () => {
    const theme: ChartColorPalette = {
      barChartPalette: bar,
      defaultChartPalette: def,
    };
    expect(resolvePalette(theme, "barChartPalette", custom)).toBe(custom);
  });

  it("the per-type token beats defaultChartPalette", () => {
    const theme: ChartColorPalette = {
      barChartPalette: bar,
      defaultChartPalette: def,
    };
    expect(resolvePalette(theme, "barChartPalette")).toBe(bar);
  });

  it("falls back to defaultChartPalette when the per-type token is unset", () => {
    const theme: ChartColorPalette = { defaultChartPalette: def };
    expect(resolvePalette(theme, "lineChartPalette")).toBe(def);
  });

  it("falls back to OCEAN_DEFAULT when the theme provides no chart palette", () => {
    // The real react-ui default theme ships no chart palettes — this is the floor.
    expect(resolvePalette({}, "barChartPalette")).toBe(OCEAN_DEFAULT);
    expect(resolvePalette({}, "defaultChartPalette")).toBe(OCEAN_DEFAULT);
  });

  it("treats an EMPTY palette array as not provided at every layer", () => {
    const theme: ChartColorPalette = {
      barChartPalette: bar,
      defaultChartPalette: def,
    };
    // empty customPalette → per-type token
    expect(resolvePalette(theme, "barChartPalette", [])).toBe(bar);
    // empty token → defaultChartPalette
    expect(
      resolvePalette({ barChartPalette: [], defaultChartPalette: def }, "barChartPalette"),
    ).toBe(def);
    // everything empty → the floor
    expect(resolvePalette({ defaultChartPalette: [] }, "barChartPalette", [])).toBe(OCEAN_DEFAULT);
  });
});

describe("getDistributedColors (center-out distribution over a ramp)", () => {
  const ramp = OCEAN_DEFAULT; // 11 stops

  it("keeps the established center-out picks on a full ramp", () => {
    // midIndex = 5 — these pin the pre-fix behavior for in-range cases.
    expect(getDistributedColors(ramp, 1)).toEqual([ramp[5]]);
    expect(getDistributedColors(ramp, 2)).toEqual([ramp[4], ramp[6]]);
    expect(getDistributedColors(ramp, 3)).toEqual([ramp[4], ramp[5], ramp[6]]);
    expect(getDistributedColors(ramp, 5)).toEqual([ramp[3], ramp[4], ramp[5], ramp[6], ramp[7]]);
  });

  it("two series on a two-color palette get both colors (was: undefined)", () => {
    // Pre-fix: [colors[0], colors[2]] → second series undefined → black fill.
    expect(getDistributedColors(["#a", "#b"], 2)).toEqual(["#a", "#b"]);
  });

  it("tiny palettes never index out of bounds (was: undefined)", () => {
    expect(getDistributedColors(["#only"], 1)).toEqual(["#only"]);
    expect(getDistributedColors(["#only"], 2)).toEqual(["#only", "#only"]);
    expect(getDistributedColors(["#only"], 3)).toEqual(["#only", "#only", "#only"]);
  });

  it("wraps correctly when series far outnumber colors (was: OOB at negative multiples)", () => {
    // 33 series / 11 colors: the first index lands at mid − 16 = −11, a negative
    // multiple of n — the pre-fix wrap computed colors[11] → undefined.
    const result = getDistributedColors(ramp, 33);
    expect(result).toHaveLength(33);
    expect(result.every((c) => typeof c === "string")).toBe(true);
  });

  it("never returns undefined for any palette-size × series-count combination", () => {
    for (let n = 1; n <= 12; n++) {
      const colors = Array.from({ length: n }, (_, i) => `#c${i}`);
      for (let len = 1; len <= 40; len++) {
        const result = getDistributedColors(colors, len);
        expect(result).toHaveLength(len);
        expect(result.every((c) => colors.includes(c))).toBe(true);
      }
    }
  });

  it("returns [] for an empty palette or non-positive length", () => {
    expect(getDistributedColors([], 5)).toEqual([]);
    expect(getDistributedColors(["#a"], 0)).toEqual([]);
  });
});

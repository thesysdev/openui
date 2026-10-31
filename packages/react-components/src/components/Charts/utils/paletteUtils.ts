import { useMemo } from "react";
import { ChartColorPalette, useTheme } from "../../ThemeProvider";
import { getColorLuminance } from "./colorLuminance";

/**
 * The single built-in default ramp.
 *
 * Predefined named palettes were removed: chart colors now come from the
 * react-ui `ThemeProvider`'s `ChartColorPalette` (its `defaultChartPalette` plus
 * the per-type tokens). This ramp is only the *floor* — used when the active
 * theme provides no chart palette at all. Future presets are expressed by
 * configuring that theme layer (e.g. `createTheme({ defaultChartPalette: … })`),
 * not by baking palettes into this package.
 */
export const OCEAN_DEFAULT: string[] = [
  "#0D47A1",
  "#1565C0",
  "#1976D2",
  "#1E88E5",
  "#2196F3",
  "#42A5F5",
  "#64B5F6",
  "#90CAF9",
  "#BBDEFB",
  "#E3F2FD",
  "#EFF8FF",
];

/**
 * Built-in diverging ramps for the heatmap's `rampMode="diverging"` when no
 * `customPalette` is given. Two hues (blue = negative, orange = positive —
 * colorblind-safer than red/green) meeting at a quiet neutral middle bucket;
 * zero always lands there because the domain is forced symmetric. Mode-keyed
 * because "visually quiet at zero" inverts with the background: near-white
 * mid on light surfaces, near-black mid on dark ones, with the EXTREMES
 * carrying the saturation in both. Replace with a react-ui
 * `divergingChartPalette` token when upstream ships one (same upstream gap
 * as `heatmapChartPalette`).
 */
export const DIVERGING_DEFAULT_LIGHT: string[] = [
  "#0D47A1",
  "#1976D2",
  "#42A5F5",
  "#90CAF9",
  "#D2E6F9",
  "#EEF1F4",
  "#FFE3BF",
  "#FFC97E",
  "#FB9E2C",
  "#EF6C00",
  "#B74D00",
];

export const DIVERGING_DEFAULT_DARK: string[] = [
  "#8AB8FF",
  "#5C9BF5",
  "#3578D6",
  "#1F56A3",
  "#143A6E",
  "#20242B",
  "#6E4A1A",
  "#A56A1D",
  "#D88B20",
  "#F5A623",
  "#FFC85C",
];

export const getDistributedColors = (colors: string[], dataLength: number): string[] => {
  const n = colors.length;
  if (n === 0 || dataLength <= 0) return [];

  const midIndex = Math.floor(n / 2);
  // Positive modulo — safe for any distance below/above the ramp. The naive
  // `n + (index % n)` form returns n (out of bounds) whenever index is a
  // negative multiple of n.
  const wrap = (index: number) => colors[((index % n) + n) % n]!;

  if (dataLength === 1) {
    return [colors[midIndex]!];
  }

  if (dataLength === 2) {
    // Clamp instead of wrap: on a 2-color ramp, midIndex±1 would wrap both
    // picks onto the same color; clamping keeps them distinct.
    return [colors[Math.max(midIndex - 1, 0)]!, colors[Math.min(midIndex + 1, n - 1)]!];
  }

  const result: string[] = [];
  const offset = Math.floor((dataLength - 1) / 2);

  for (let i = 0; i < dataLength; i++) {
    result.push(wrap(midIndex + (i - offset)));
  }

  return result;
};

/**
 * Resolve the color ramp for a chart, in priority order:
 *   1. `customPalette`            — explicit per-call override (a raw array)
 *   2. `theme[themePaletteName]`  — the per-type token (e.g. `barChartPalette`)
 *   3. `theme.defaultChartPalette`— the theme's catch-all chart palette
 *   4. `OCEAN_DEFAULT`            — the built-in floor
 *
 * Pure (no hooks) so it can be unit-tested directly.
 */
export const resolvePalette = (
  theme: ChartColorPalette,
  themePaletteName: keyof ChartColorPalette,
  customPalette?: string[],
): string[] => {
  // An empty array can't color anything — treat it as "not provided" and fall
  // through to the next layer instead of propagating [] into every series.
  const candidates = [customPalette, theme[themePaletteName], theme.defaultChartPalette];
  return candidates.find((p) => p && p.length > 0) ?? OCEAN_DEFAULT;
};

/**
 * Distributed series colors for a chart, themed via the react-ui ThemeProvider.
 * `themePaletteName` is the per-type token the chart asks for (callers pass
 * `"barChartPalette"`, `"lineChartPalette"`, … or `"defaultChartPalette"`).
 */
export const useChartPalette = ({
  customPalette,
  themePaletteName,
  dataLength,
}: {
  customPalette?: string[];
  themePaletteName: keyof ChartColorPalette;
  dataLength: number;
}) => {
  const { theme } = useTheme();
  const palette = resolvePalette(theme, themePaletteName, customPalette);

  return useMemo(() => {
    return getDistributedColors(palette, dataLength);
  }, [palette, dataLength]);
};

/**
 * A palette read as a sequential low → high ramp (heatmap, calendar levels),
 * oriented so its low end is the color nearest the surface: the lightest in
 * light mode, the darkest in dark mode. Low values then fade into the
 * background and high values stand out. Theme and built-in palettes run dark →
 * light (the series order), so light mode reverses them.
 */
export const orientRampToSurface = (ramp: string[], mode: string | undefined): string[] => {
  if (ramp.length < 2) return ramp;
  const first = getColorLuminance(ramp[0]!);
  const last = getColorLuminance(ramp[ramp.length - 1]!);
  // Without a canvas (SSR) assume the dark → light series order.
  const firstIsLighter = first !== null && last !== null ? first > last : false;
  const lightFirst = mode !== "dark";
  return firstIsLighter === lightFirst ? ramp : [...ramp].reverse();
};

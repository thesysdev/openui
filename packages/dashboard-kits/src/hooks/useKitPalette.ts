// The package root, not the `@openuidev/react-ui/ThemeProvider` subpath: that
// build creates a ThemeContext of its own, so it would never see the
// ThemeProvider a host renders from the root.
import { useTheme, type ChartColorPalette } from "@openuidev/react-ui";
import { useMemo } from "react";

/**
 * OpenUI's built-in chart ramp (react-ui's OCEAN_DEFAULT), used when the
 * active theme sets no chart palette.
 */
export const OCEAN = [
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
 * Colours for `count` series, taken from a ramp the way react-ui's charts take
 * them: centred on the ramp's middle step, two series on either side of it.
 */
export function distributeColors(ramp: string[], count: number): string[] {
  const n = ramp.length;
  if (n === 0 || count <= 0) return [];
  const mid = Math.floor(n / 2);
  if (count === 1) return [ramp[mid]!];
  if (count === 2) return [ramp[Math.max(mid - 1, 0)]!, ramp[Math.min(mid + 1, n - 1)]!];
  const offset = Math.floor((count - 1) / 2);
  return Array.from({ length: count }, (_, i) => ramp[(((mid + i - offset) % n) + n) % n]!);
}

/**
 * Series colours from the active OpenUI theme: the chart type's own palette
 * if the theme sets one, else its `defaultChartPalette`, else OpenUI's Ocean
 * ramp. So a theme passed to ThemeProvider recolours the kit charts the same
 * way it recolours react-ui's.
 */
export function useKitPalette(count: number, palette?: keyof ChartColorPalette): string[] {
  const { theme } = useTheme();
  const own = palette ? theme[palette] : undefined;
  const ramp = own?.length
    ? own
    : theme.defaultChartPalette?.length
      ? theme.defaultChartPalette
      : OCEAN;
  return useMemo(() => distributeColors(ramp, count), [ramp, count]);
}

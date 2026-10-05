import type { ChartData } from "../types";

/**
 * The hover transition shared by the polar fill shapes (pie wedge, radial bar):
 * the non-hovered `fill-opacity` dim + the hovered `filter` brightness, both
 * 200ms. One const so the two charts can't drift apart.
 */
export const POLAR_HOVER_TRANSITION = "fill-opacity 0.2s ease, filter 0.2s ease";

export function sortByValueDescending<T extends ChartData>(data: T, dataKey: string): T {
  return [...data].sort((a, b) => {
    const aVal = Number(a[dataKey]) || 0;
    const bVal = Number(b[dataKey]) || 0;
    return bVal - aVal;
  }) as T;
}

export function getSliceStyle(index: number, hoveredIndex: number | null): React.CSSProperties {
  if (hoveredIndex === null) return {};
  if (index === hoveredIndex) {
    return { fillOpacity: 1, filter: "brightness(1.08)" };
  }
  // fill-opacity, NOT opacity: the entrance keyframe's forwards fill holds
  // `opacity: 1` on these elements forever (the class is never removed), and
  // CSS-animation declarations beat inline styles even in the fill phase — an
  // opacity dim is silently dead after the entrance plays. fill-opacity isn't
  // animated, so it composes. Slices/bars are pure fills: visually identical.
  return { fillOpacity: 0.4 };
}

export function formatPercentage(value: number, total: number): string {
  if (total === 0) return "0%";
  return `${((value / total) * 100).toFixed(1)}%`;
}

export function radarAxisAngle(index: number, total: number): number {
  return (2 * Math.PI * index) / total - Math.PI / 2;
}

export function radarLabelAnchor(angle: number): "start" | "middle" | "end" {
  const EPSILON = 0.1;
  const cos = Math.cos(angle);
  if (Math.abs(cos) < EPSILON) return "middle";
  return cos > 0 ? "start" : "end";
}

import type { ChartData } from "../types";

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
    return { opacity: 1, filter: "brightness(1.08)" };
  }
  return { opacity: 0.4 };
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

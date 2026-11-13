import type { CSSProperties, ReactNode } from "react";
import { widthClass, type Width } from "../../../shared/schema";

/** Card heights a row can take, 80px apart. */
export const ROW_HEIGHTS = [240, 320, 400, 480, 560, 640] as const;
export type RowHeight = (typeof ROW_HEIGHTS)[number];
export interface RowProps {
  /** fit: the card's content sizes itself (a Table, KeyValues, a Donut) instead of stretching to the row. */
  items: { children: ReactNode; width: Width; height: RowHeight; fit?: boolean }[];
  height?: RowHeight;
}
export function Row({ items, height }: RowProps) {
  const widths = items.map((item) => item.width);
  const mediumFill = orphans(widths, ["quarter", "third", "half"]);
  const smallFill = orphans(widths, ["quarter"]);
  const wideSpans = fillLines(widths);
  const resolvedHeight =
    height && ROW_HEIGHTS.includes(height)
      ? height
      : Math.max(...items.map((item) => item.height), 240);
  // When every card sizes itself, a fixed height only adds empty space under the content: the
  // cards fit it, and the grid still lines them up at the tallest one.
  const fit = items.length > 0 && items.every((item) => item.fit);
  return (
    <div
      className="openui-dashboard-row"
      data-fit={fit ? "" : undefined}
      style={
        fit ? undefined : ({ "--openui-dashboard-row-h": `${resolvedHeight}px` } as CSSProperties)
      }
    >
      {items.map((item, i) => {
        const grown = wideSpans[i] !== SPAN[widths[i] ?? "half"];
        return (
          <div
            key={i}
            className={`openui-dashboard-cell ${widthClass(widths[i], "half")}${mediumFill.has(i) ? " openui-dashboard-md-full" : ""}${smallFill.has(i) ? " openui-dashboard-sm-full" : ""}`}
            data-wide-span={grown ? "" : undefined}
            style={
              grown
                ? ({ "--openui-dashboard-wide-span": wideSpans[i] } as CSSProperties)
                : undefined
            }
          >
            {item.children}
          </div>
        );
      })}
    </div>
  );
}

const SPAN: Record<Width, number> = {
  quarter: 3,
  third: 4,
  half: 6,
  "two-thirds": 8,
  "three-quarters": 9,
  full: 12,
};

/**
 * At full width, cards flow onto lines of 12 columns. A line that falls
 * short (two-thirds + half wraps the half onto a line of its own) would leave
 * a hole, so its cards share out the spare columns as evenly as they can,
 * the remainder going to the last cards. Rows that add up are untouched.
 */
function fillLines(widths: Width[]): number[] {
  const spans = widths.map((width) => SPAN[width] ?? 6);
  const result = [...spans];
  let start = 0;
  let used = 0;
  const close = (end: number) => {
    const count = end - start;
    const spare = 12 - used;
    if (count <= 0 || spare <= 0) return;
    for (let i = 0; i < count; i++) {
      result[start + i] =
        (result[start + i] ?? 0) +
        Math.floor(spare / count) +
        (i >= count - (spare % count) ? 1 : 0);
    }
  };
  spans.forEach((span, i) => {
    if (used + span > 12) {
      close(i);
      start = i;
      used = 0;
    }
    used += span;
  });
  close(spans.length);
  return result;
}

/**
 * At narrower sizes some widths become halves and the rest full lines
 * (below 1100px: quarter, third and half; below 720px: quarter only). Find the
 * halves that would then sit alone beside an empty half, so they can take the
 * whole line instead.
 */
function orphans(widths: Width[], halves: Width[]): Set<number> {
  const fill = new Set<number>();
  let open: number | null = null; // a half waiting for a partner
  widths.forEach((width, i) => {
    if (!halves.includes(width)) {
      if (open !== null) fill.add(open);
      open = null;
    } else if (open === null) {
      open = i;
    } else {
      open = null;
    }
  });
  if (open !== null) fill.add(open);
  return fill;
}

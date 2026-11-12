"use client";

export type ReferenceChipLabelProps = {
  viewBox?: { x: number; y: number; width: number; height: number };
  text?: string;
  /** A horizontal line's chip sits at its start (left) or end (right): whichever covers less data. */
  align?: "start" | "end";
};

export const CHIP = { height: 18, radius: 5, fontSize: 11 } as const;

export function ReferenceChipLabel({ viewBox, text, align = "start" }: ReferenceChipLabelProps) {
  if (!viewBox || !text) return null;
  const vertical = (viewBox.height ?? 0) > (viewBox.width ?? 0);
  const h = CHIP.height;
  const w = Math.round(text.length * 6.1) + 14;
  const x = vertical
    ? viewBox.x - w / 2
    : align === "end"
      ? viewBox.x + viewBox.width - w
      : viewBox.x;
  // A vertical line's chip sits above the plot, covering only the line's first 3px,
  // so about 4px of air remains above the first bar. Charts leave CHIP_ROOM at the top for it.
  const y = vertical ? viewBox.y - h + 3 : viewBox.y - h / 2;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={CHIP.radius} fill="var(--openui-dashboard-ink)" />
      <text
        x={x + w / 2}
        y={y + h / 2}
        dy={3.5}
        textAnchor="middle"
        fontSize={CHIP.fontSize}
        fontWeight={500}
        fill="var(--openui-dashboard-surface)"
      >
        {text}
      </text>
    </g>
  );
}

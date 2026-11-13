import { Symbols } from "recharts";
import type { MarkShape } from "../../../shared/legend";
export const SIZE_RANGE: [number, number] = [60, 520];
export type ScatterMarkProps = {
  cx?: number;
  cy?: number;
  size?: number;
  fill?: string;
  fillOpacity?: number;
  type: MarkShape;
};

/** How strong a dot's fill is at a given area: small dots dark, big dots faint, so large ones never bury their neighbours. */
export const dotFill = (size: number) => {
  const t = Math.min(1, Math.max(0, (size - SIZE_RANGE[0]) / (SIZE_RANGE[1] - SIZE_RANGE[0])));
  return 0.7 - 0.55 * t;
};

/**
 * A dot: its fill fading from dark (small) to faint (big), a subtle outline in its colour, and a tiny solid
 * centre, so every point keeps a crisp centre to read however big it is.
 */
export function ScatterMark({
  cx = 0,
  cy = 0,
  size = 130,
  fill = "var(--openui-dashboard-series-1)",
  fillOpacity = 0.75,
  type,
}: ScatterMarkProps) {
  const fade = fillOpacity / 0.75;
  return (
    <g>
      <Symbols
        cx={cx}
        cy={cy}
        type={type}
        size={size}
        fill={fill}
        fillOpacity={dotFill(size) * fade}
        stroke={fill}
        strokeOpacity={0.5 * fade}
        strokeWidth={1}
      />
      <Symbols cx={cx} cy={cy} type={type} size={12} fill={fill} fillOpacity={fade} />
    </g>
  );
}

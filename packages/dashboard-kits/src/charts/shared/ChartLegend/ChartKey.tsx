import { DASH_ARRAYS, type LinePattern } from "../linePatterns";

/** How a key draws: a stroke for lines, a square for fills, dashes or dots for context. */
export interface ChartKeyShape {
  kind?: "line" | "rect";
  dashed?: boolean;
  dotted?: boolean;
  /**
   * A line's dash pattern (see `linePatterns`). The key then draws the line's
   * own stroke, wider, so the legend shows the dash the chart draws.
   */
  pattern?: LinePattern;
}

/** A legend or tooltip key drawn like its mark, in its series color. */
export function ChartKey({
  color,
  kind = "line",
  dashed,
  dotted,
  pattern,
}: ChartKeyShape & { color: string }) {
  if (pattern && kind === "line") {
    return (
      <svg className="kit-key kit-key--pattern" viewBox="0 0 24 4" style={{ color }} aria-hidden>
        <line
          x1={1}
          x2={23}
          y1={2}
          y2={2}
          stroke="currentColor"
          strokeWidth={pattern === "context" ? 1.5 : 2}
          strokeLinecap="round"
          strokeDasharray={DASH_ARRAYS[pattern]}
        />
      </svg>
    );
  }
  const style = dotted ? " kit-key--dotted" : dashed ? " kit-key--dashed" : "";
  return <i className={`kit-key kit-key--${kind}${style}`} style={{ color }} aria-hidden />;
}

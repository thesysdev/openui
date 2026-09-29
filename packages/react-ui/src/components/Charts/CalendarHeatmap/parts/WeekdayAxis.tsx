interface WeekdayAxisProps {
  /** The rows that get a label (already filtered), with their weekday text. */
  ticks: Array<{ row: number; label: string }>;
  /** Row pitch in px — the label centers on its row band. */
  pitchY: number;
  /** Right edge x for every weekday label (labels are end-anchored). */
  x: number;
  classPrefix: string;
}

/**
 * The left weekday axis: an end-anchored SVG `<text>` per labeled row, centered
 * on the row band. Rendered inside a group already translated down past the top
 * month gutter, so `row * pitchY` lines each label up with its cell row.
 */
export function WeekdayAxis({ ticks, pitchY, x, classPrefix }: WeekdayAxisProps) {
  return (
    <g>
      {ticks.map(({ row, label }) => (
        <text
          key={row}
          x={x}
          y={row * pitchY + pitchY / 2}
          textAnchor="end"
          dominantBaseline="central"
          className={`${classPrefix}-weekday-label`}
        >
          {label}
        </text>
      ))}
    </g>
  );
}

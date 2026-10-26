/** The pace bar runs to this percent, so an overshoot still shows. */
const PACE_MAX = 150;

export interface PaceCellProps {
  /** Pace as a percent of where the line says it should be by now. */
  pace: number;
  /** The on-pace band, in percent: e.g. [80, 110] for commits, [98, 102] for budgets. */
  band: [number, number];
  /** Mark color: on_track, under, over, or bad (status class names). */
  mark: string;
  /** Status pill tone and text. */
  tone: string;
  label: string;
}

/**
 * A pace bar with its on-pace band and a mark at the pace, over a status
 * pill: "116% · Over pace". Used by the pacing tables (AI credit commits, ad
 * budgets); styles live with them in _base.scss.
 */
export function PaceCell({ pace, band, mark, tone, label }: PaceCellProps) {
  const at = (v: number) => `${(Math.min(v, PACE_MAX) / PACE_MAX) * 100}%`;
  return (
    <span className="kit-pace">
      <span className="kit-pace__track" aria-hidden>
        <i
          className="kit-pace__band"
          style={{ left: at(band[0]), width: `calc(${at(band[1])} - ${at(band[0])})` }}
        />
        <i className={`kit-pace__mark kit-pace__mark--${mark}`} style={{ left: at(pace) }} />
      </span>
      <span className={`kit-status kit-status--${tone}`}>
        {pace}% · {label}
      </span>
    </span>
  );
}

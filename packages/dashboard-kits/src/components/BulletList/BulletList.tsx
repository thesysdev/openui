import type { TargetProgress } from "../../core/schemas";
import { formatValue } from "../charts/utils/format";

export interface BulletListProps {
  targets: TargetProgress[];
}

const STATUS = {
  ahead: { text: "Ahead", tone: "good" },
  on_pace: { text: "On pace", tone: "neutral" },
  behind: { text: "Behind", tone: "bad" },
  under: { text: "Under budget", tone: "good" },
  over: { text: "Over budget", tone: "bad" },
} as const;

/**
 * Progress toward targets as bullet charts (Stephen Few): one bar per
 * metric for the actual so far, a tick for the target to date, a dashed line
 * for the whole period's target, and the forecast range as a light band past
 * the bar. Each row carries its status and the numbers in words.
 */
export function BulletList({ targets }: BulletListProps) {
  return (
    <ul className="kit-bullets">
      {targets.map((t) => {
        const max = Math.max(t.target, t.forecastHigh, t.actual) * 1.04 || 1;
        const at = (v: number) => `${Math.max(0, Math.min(100, (v / max) * 100))}%`;
        const f = (v: number) => formatValue(v, t.format);
        const status = STATUS[t.status];
        return (
          <li key={t.label} className="kit-bullet">
            <div className="kit-bullet__head">
              <span className="kit-bullet__label">{t.label}</span>
              <span className={`kit-bullet__status kit-bullet__status--${status.tone}`}>
                {status.text}
              </span>
            </div>
            <div
              className="kit-bullet__track"
              role="img"
              aria-label={`${t.label}: ${f(t.actual)} so far against ${f(t.toDate)} to date and ${f(t.target)} for the month; forecast ${f(t.forecast)}, between ${f(t.forecastLow)} and ${f(t.forecastHigh)}.`}
            >
              <span
                className="kit-bullet__range"
                style={{
                  left: at(t.forecastLow),
                  width: `calc(${at(t.forecastHigh)} - ${at(t.forecastLow)})`,
                }}
              />
              <span
                className={`kit-bullet__bar kit-bullet__bar--${status.tone}`}
                style={{ width: at(t.actual) }}
              />
              <span className="kit-bullet__todate" style={{ left: at(t.toDate) }} />
              <span className="kit-bullet__target" style={{ left: at(t.target) }} />
            </div>
            <div className="kit-bullet__figures">
              <span>
                <strong>{f(t.actual)}</strong> of {f(t.toDate)} to date
              </span>
              <span className="kit-muted">
                Forecast {f(t.forecast)} ({f(t.forecastLow)}–{f(t.forecastHigh)}) of {f(t.target)}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

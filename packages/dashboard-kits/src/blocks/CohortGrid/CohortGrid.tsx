import { formatCurrency, formatNumber } from "../../core/format";
import type { CohortRow } from "../../core/schemas";
import { ScrollRegion } from "../ScrollRegion";

/**
 * A single-hue sequential fill: the accent mixed into the card, so low values
 * recede in both modes. It tops out at 90% so the cell's ink text keeps 4.5:1
 * on the strongest cell in light mode (white text never does on this blue).
 */
export const heat = (intensity: number) =>
  `color-mix(in oklab, var(--kit-accent) ${Math.round(6 + Math.max(0, Math.min(1, intensity)) * 84)}%, var(--kit-card))`;

export interface CohortGridProps {
  cohorts: CohortRow[];
  /** One label per period since a cohort started; defaults to P0, P1, … */
  periodLabels?: string[];
  /** Rates as percents, or cumulative value per customer as currency. */
  format?: "percent" | "currency";
  /** Header for the cohort size column. Default "Users". */
  sizeLabel?: string;
}

/**
 * Cohort table: one row per cohort and one shaded cell per period since it
 * started, a size-weighted average row, and a scale legend. Read down a
 * column to compare cohorts at the same age.
 */
export function CohortGrid({ cohorts, periodLabels, format, sizeLabel }: CohortGridProps) {
  const currency = format === "currency";
  const periods = Math.max(...cohorts.map((c) => c.values.length));
  const labels = periodLabels ?? Array.from({ length: periods }, (_, i) => `P${i}`);
  const all = cohorts.flatMap((c) => c.values);
  const max = Math.max(1, ...all);
  // Shares start the scale at zero; amounts, and percentages that never fall
  // near it (net revenue retention), start at their smallest value.
  const min = currency || Math.min(...all) >= 50 ? Math.min(...all) : 0;
  const scale = (v: number) => (v - min) / (max - min || 1);
  const fmt = (v: number) =>
    currency ? formatCurrency(Math.round(v)) : `${v.toFixed(v < 10 ? 1 : 0)}%`;
  // Forecast cells are the last `predicted` values of a row, and a period in
  // progress is the last value of a `partial` row; averages leave both out.
  const forecast = (c: CohortRow, i: number) => i >= c.values.length - (c.predicted ?? 0);
  const inProgress = (c: CohortRow, i: number) => !!c.partial && i === c.values.length - 1;
  const hasForecast = cohorts.some((c) => c.predicted);
  const hasPartial = cohorts.some((c) => c.partial);
  const hasPayback = cohorts.some((c) => c.payback != null);
  const average = Array.from({ length: periods }, (_, i) => {
    const rows = cohorts.filter((c) => c.values[i] != null && !forecast(c, i) && !inProgress(c, i));
    const size = rows.reduce((a, c) => a + c.size, 0);
    return size ? rows.reduce((a, c) => a + c.values[i] * c.size, 0) / size : undefined;
  });
  return (
    <div className="kit-cohort-wrap">
      <ScrollRegion label="Cohort table">
        <table className="kit-cohort">
          <thead>
            <tr>
              <th>Cohort</th>
              <th className="kit-num">{sizeLabel ?? "Users"}</th>
              {labels.slice(0, periods).map((label) => (
                <th key={label}>{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cohorts.map((row) => (
              <tr key={row.cohort}>
                <th scope="row">{row.cohort}</th>
                <td className="kit-num kit-muted">{formatNumber(row.size)}</td>
                {Array.from({ length: periods }, (_, i) => {
                  const v = row.values[i];
                  if (v == null) return <td key={i} />;
                  const s = scale(v);
                  const predicted = forecast(row, i);
                  const partial = inProgress(row, i);
                  const paidBack = row.payback === i;
                  return (
                    <td key={i} className="kit-cohort__cell-wrap">
                      <span
                        className={`kit-cohort__cell${predicted ? " kit-cohort__cell--predicted" : ""}${partial ? " kit-cohort__cell--partial" : ""}${paidBack ? " kit-cohort__cell--payback" : ""}`}
                        style={{ background: heat(s) }}
                        title={`${row.cohort}, ${labels[i] ?? i}: ${fmt(v)}${predicted ? " (forecast)" : ""}${partial ? " (so far; the period is not over)" : ""}${paidBack ? " · paid back what it cost to acquire" : ""}`}
                      >
                        {fmt(v)}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr className="kit-cohort__average">
              <th scope="row">Average</th>
              <td className="kit-num kit-muted">
                {formatNumber(cohorts.reduce((a, c) => a + c.size, 0) / cohorts.length)}
              </td>
              {average.map((v, i) => (
                <td key={i} className="kit-num">
                  {v == null ? "" : fmt(v)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </ScrollRegion>
      {(hasForecast || hasPartial || hasPayback) && (
        <div className="kit-cohort__keys" aria-hidden>
          {hasForecast && (
            <span>
              <i className="kit-cohort__key kit-cohort__cell--predicted" /> Forecast
            </span>
          )}
          {hasPartial && (
            <span>
              <i className="kit-cohort__key kit-cohort__cell--partial" /> In progress, left out of
              averages
            </span>
          )}
          {hasPayback && (
            <span>
              <i className="kit-cohort__key kit-cohort__cell--payback" /> Paid back acquisition cost
            </span>
          )}
        </div>
      )}
      <div className="kit-scale-legend" aria-hidden>
        <span>{fmt(min).replace(/^0\.0%$/, "0%")}</span>
        <span
          className="kit-scale-legend__ramp"
          style={{ background: `linear-gradient(90deg, ${heat(0)}, ${heat(0.5)}, ${heat(1)})` }}
        />
        <span>{fmt(max)}</span>
      </div>
    </div>
  );
}

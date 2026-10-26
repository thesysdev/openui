import { useId } from "react";
import { TrendChart } from "../../charts/TrendChart";
import type { Kpi, Trend } from "../../core/schemas";
import { DefinitionTip } from "../DefinitionTip";
import { DeltaPill } from "../DeltaPill";
import { UsualNote } from "../KpiStrip/KpiStrip";
import { RollingNumber } from "../RollingNumber";

export interface HeroMetricProps {
  /** The headline metric. */
  metric: Kpi;
  /** Its trend against the prior period, last year, or the plan. */
  trend?: Trend;
  /** The supporting KPIs, each with its own trend, that a tile can switch to. */
  metrics?: Kpi[];
  /** The label of the KPI shown instead of the headline metric, if any. */
  selected?: string;
  /** Called with "" when the reader goes back to the headline metric. */
  onSelect?: (label: string) => void;
}

/**
 * The number a dashboard leads with, at hero size, with its change and a large
 * trend against the prior period: the gap shaded by whether it is good, events
 * marked, today dotted as in progress. When a KPI tile is selected the hero
 * shows that metric instead, and the trend glides to its shape.
 */
export function HeroMetric({
  metric: hero,
  trend,
  metrics = [],
  selected,
  onSelect,
}: HeroMetricProps) {
  const picked = selected ? metrics.find((k) => k.label === selected && k.trend) : undefined;
  const m = picked ?? hero;
  const t = picked?.trend ?? trend;
  const asOf = trend?.asOf;
  const against = t?.comparisonLabel ?? trend?.comparisonLabel ?? "Prior period";
  const tipId = `hero-def-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <div className="kit-hero">
      <div className="kit-hero__head">
        <div className="kit-hero__top">
          {m.definition ? (
            <span className="kit-def-host">
              <span className="kit-hero__label kit-def-label" tabIndex={0} aria-describedby={tipId}>
                {m.label}
              </span>
              <DefinitionTip id={tipId} definition={m.definition} />
            </span>
          ) : (
            <span className="kit-hero__label">{m.label}</span>
          )}
          {picked && onSelect && (
            <button type="button" className="kit-hero__back" onClick={() => onSelect("")}>
              <svg viewBox="0 0 12 12" aria-hidden>
                <path d="M7.5 2.5 4 6l3.5 3.5" />
              </svg>
              {hero.label}
            </button>
          )}
          {asOf && (
            <span className="kit-live">
              <i className="kit-live__dot" aria-hidden />
              Updated {asOf}
            </span>
          )}
        </div>
        <div className="kit-hero__line">
          <RollingNumber value={m.value} className="kit-hero__value" />
          <DeltaPill change={m.change} goodDirection={m.goodDirection} />
          {m.previous && (
            <span className="kit-hero__previous">
              vs {m.previous} {against.toLowerCase()}
            </span>
          )}
        </div>
        {m.usual && m.usual.status !== "within" ? (
          <span className="kit-hero__hint">
            <UsualNote kpi={m} />
          </span>
        ) : (
          m.hint && <span className="kit-hero__hint">{m.hint}</span>
        )}
        {!picked && trend?.summary && <p className="kit-hero__lead">{trend.summary}</p>}
      </div>
      {t && t.labels.length > 0 && (
        <TrendChart
          labels={t.labels}
          format={t.format}
          events={t.events ?? trend?.events}
          partial={t.partial}
          target={t.target}
          band={t.band}
          height={240}
          fill
          compare={m.goodDirection ?? "up"}
          series={[
            { name: "This period", values: t.current, emphasis: "primary" },
            ...(t.previous
              ? [{ name: against, values: t.previous, emphasis: "muted" as const }]
              : []),
          ]}
        />
      )}
    </div>
  );
}

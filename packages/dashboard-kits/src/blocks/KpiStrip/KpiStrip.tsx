import { useId } from "react";
import { Sparkline } from "../../charts/Sparkline";
import { changeTone } from "../../core/format";
import { useContainerSize } from "../../core/hooks";
import type { Kpi } from "../../core/schemas";
import { DefinitionTip } from "../DefinitionTip";
import { DeltaPill } from "../DeltaPill";
import { RollingNumber } from "../RollingNumber";
import { kpiColumns } from "./kpiLayout";

/** "Unusually high · usual $1.1M–$1.2M", toned by whether that direction is good. */
export function UsualNote({ kpi }: { kpi: Kpi }) {
  const usual = kpi.usual!;
  const tone = changeTone(usual.status === "above" ? 1 : -1, kpi.goodDirection);
  return (
    <span className="kit-usual">
      <span className={`kit-usual__flag kit-text-${tone}`}>
        Unusually {usual.status === "above" ? "high" : "low"}
      </span>{" "}
      · usual {usual.low}–{usual.high}
    </span>
  );
}

export interface KpiStripProps {
  metrics: Kpi[];
  /** The label of the tile shown in the hero chart, if any. */
  selected?: string;
  /**
   * Make tiles with a trend into tabs: called with a tile's label when it is
   * chosen, or "" when the chosen tile is chosen again.
   */
  onSelect?: (label: string) => void;
}

/**
 * Supporting KPI tiles: each value with its change (colored by whether that
 * direction is good), the previous value, a sparkline, and a definition. The
 * strip balances its rows to its width, and each row's tiles share row lines
 * so values align when a label wraps.
 */
export function KpiStrip({ metrics, selected, onSelect }: KpiStripProps) {
  const [ref, size] = useContainerSize<HTMLDivElement>(1200);
  const tipId = useId().replace(/[^a-zA-Z0-9]/g, "");
  const columns = kpiColumns(metrics.length, size.width);
  const rows = Array.from({ length: Math.ceil(metrics.length / columns) }, (_, r) =>
    metrics.slice(r * columns, (r + 1) * columns),
  );
  const tile = (m: Kpi) => (
    <>
      <span className={`kit-kpi__label${m.definition ? " kit-def-label" : ""}`}>{m.label}</span>
      <RollingNumber value={m.value} className="kit-kpi__value" />
      <span className="kit-kpi__meta">
        <DeltaPill change={m.change} goodDirection={m.goodDirection} />
        {m.previous && <span className="kit-kpi__previous">vs {m.previous}</span>}
      </span>
      {m.series && m.series.length > 1 ? <Sparkline values={m.series} /> : <span />}
      <span className="kit-kpi__hint">
        {m.usual && m.usual.status !== "within" ? <UsualNote kpi={m} /> : m.hint}
      </span>
    </>
  );
  return (
    <div ref={ref} className="kit-kpis">
      {rows.map((row, r) => (
        <div
          key={r}
          className="kit-kpis__row"
          style={{ gridTemplateColumns: `repeat(${row.length}, minmax(0, 1fr))` }}
        >
          {row.map((m, i) => {
            // Each tile sits in a host that shows its definition on hover or focus.
            const id = m.definition ? `kpi-def-${tipId}-${r}-${i}` : undefined;
            return (
              <div key={`${m.label}-${i}`} className="kit-def-host kit-kpis__cell">
                {onSelect && m.trend ? (
                  <button
                    type="button"
                    className="kit-kpi kit-kpi--tab"
                    aria-pressed={selected === m.label}
                    aria-describedby={id}
                    onClick={() => onSelect(selected === m.label ? "" : m.label)}
                  >
                    {tile(m)}
                  </button>
                ) : (
                  <div className="kit-kpi" tabIndex={id ? 0 : undefined} aria-describedby={id}>
                    {tile(m)}
                  </div>
                )}
                {id && m.definition && <DefinitionTip id={id} definition={m.definition} />}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

"use client";

import { useRef, useState, type ReactNode } from "react";
import { useIsomorphicLayoutEffect } from "../../../shared/hooks";
import type { KpiProps } from "../Kpi";
import { CompactKpi } from "./CompactKpi";

/* ---------- Kpis: the strip of stat tiles ---------- */

export interface KpisProps {
  items: ReactNode[];
  facts: Omit<KpiProps, "streaming">[];
  streaming: boolean;
}

/** Tiles never render narrower than this; the strip wraps instead. Sized so
 *  a text value like "Operational" with its status dot fits untruncated. */
const MIN_TILE = 210;
/** Most tiles per row, however wide the strip gets. */
const MAX_PER_ROW = 6;
/** Past six KPIs the strip turns compact: narrower items, up to eight a row. */
const MIN_COMPACT = 150;
const MAX_COMPACT = 8;

/** The fewest rows that fit, then columns spread evenly across them: 5 → 3 + 2, never 4 + 1. */
function columns(count: number, max: number): number {
  if (count <= 0) return 1;
  const rows = Math.ceil(count / max);
  return Math.ceil(count / rows);
}

export function Kpis(props: KpisProps) {
  const items = props.items;
  // Column count follows the measured width: as many ≥MIN_TILE columns as
  // fit, then tiles wrap into balanced rows (6 → 3 + 3, never 5 + 1).
  const strip = useRef<HTMLDivElement>(null);
  const compact = items.length > MAX_PER_ROW;
  const [cols, setCols] = useState(() => Math.max(1, Math.min(items.length || 1, 4)));
  // Measured before paint, so the strip never shows its first guess of columns and then jumps.
  useIsomorphicLayoutEffect(() => {
    const el = strip.current;
    if (!el) return;
    const update = () => {
      const perRow = compact
        ? Math.max(1, Math.min(MAX_COMPACT, Math.floor(el.clientWidth / MIN_COMPACT)))
        : Math.max(1, Math.min(MAX_PER_ROW, Math.floor(el.clientWidth / MIN_TILE)));
      const next = columns(items.length, perRow);
      setCols((current) => (current === next ? current : next));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [items.length, compact]);
  // Past six headline numbers the tiles turn compact: the value on top,
  // then the label with its change on the right, wrapping in balanced rows
  // with the strip's own dividers.
  if (compact) {
    const facts = props.facts;
    const rows: (typeof facts)[] = [];
    for (let i = 0; i < facts.length; i += cols) rows.push(facts.slice(i, i + cols));
    return (
      <div className="openui-dashboard-kpis openui-dashboard-kpis-compact" ref={strip}>
        {rows.map((row, r) => (
          <div key={r} className="openui-dashboard-kpis-row">
            {row.map((fact, keyIndex) => (
              <div key={`${keyIndex}-${fact.label}`} className="openui-dashboard-kpi-cell">
                <CompactKpi fact={fact} streaming={props.streaming} />
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }
  // Real rows: a short last row splits the full width evenly instead of
  // leaving an empty corner, and each wrapped row draws one continuous
  // separator.
  const rows: (typeof items)[] = [];
  for (let i = 0; i < items.length; i += cols) rows.push(items.slice(i, i + cols));
  return (
    <div className="openui-dashboard-kpis" ref={strip}>
      {rows.map((row, r) => (
        <div key={r} className="openui-dashboard-kpis-row">
          {row.map((item, i) => (
            <div key={i} className="openui-dashboard-kpi-cell">
              {item}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

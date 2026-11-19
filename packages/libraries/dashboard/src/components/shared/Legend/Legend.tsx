"use client";

import { useEffect, useRef, useState } from "react";
import { Symbols } from "recharts";
import { useIsomorphicLayoutEffect } from "../../../shared/hooks";

import type { LegendEntry } from "../../../shared/legend";
export type { LegendEntry, MarkShape } from "../../../shared/legend";

export type LegendMarkProps = { entry: LegendEntry };

export type LegendProps = {
  entries: LegendEntry[];
  onHover?: (name: string | null) => void;
};

/* ---------- Legend ---------- */

function LegendMark({ entry }: LegendMarkProps) {
  if (entry.mark !== undefined) return <>{entry.mark}</>;
  if (entry.shape)
    return (
      <svg
        className="openui-dashboard-legend-shape"
        width={10}
        height={10}
        viewBox="0 0 10 10"
        aria-hidden
      >
        <Symbols
          cx={5}
          cy={5}
          type={entry.shape}
          size={entry.shape === "circle" ? 50 : 42}
          fill={entry.color}
        />
      </svg>
    );
  return entry.dashed || entry.dotted || entry.line ? (
    <span
      className={
        entry.dotted
          ? "openui-dashboard-legend-line openui-dashboard-legend-dotted"
          : entry.line
            ? "openui-dashboard-legend-line openui-dashboard-legend-solid"
            : "openui-dashboard-legend-line"
      }
      style={{ borderTopColor: entry.color }}
    />
  ) : (
    <span className="openui-dashboard-legend-swatch" style={{ background: entry.color }} />
  );
}

const LEGEND_GAP = 16;

const MORE_WIDTH = 70;

/**
 * One line, never wrapping: every key is laid out and measured (the ones that
 * don't fit stay in the DOM, invisible and out of flow, so their widths are
 * always known), and whatever doesn't fit folds into a "More" menu. Hidden
 * entries (the previous period while compare is off) are left out entirely.
 */
export function Legend({ entries, onHover }: LegendProps) {
  const shown = entries.filter((entry) => !entry.hidden);
  const row = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(shown.length);
  const [open, setOpen] = useState(false);
  const signature = shown.map((entry) => entry.name).join("|");

  useIsomorphicLayoutEffect(() => {
    const el = row.current;
    if (!el) return;
    const measure = () => {
      const widths = [
        ...el.querySelectorAll<HTMLElement>(":scope > .openui-dashboard-legend-item"),
      ].map((item) => item.offsetWidth);
      const all = widths.reduce((sum, w, i) => sum + w + (i ? LEGEND_GAP : 0), 0);
      let next = widths.length;
      if (all > el.clientWidth) {
        let used = 0;
        next = 0;
        for (let i = 0; i < widths.length; i++) {
          const width = used + (widths[i] ?? 0) + (i ? LEGEND_GAP : 0);
          if (width + LEGEND_GAP + MORE_WIDTH > el.clientWidth) break;
          used = width;
          next = i + 1;
        }
        next = Math.max(1, next);
      }
      setFit((current) => (current === next ? current : next));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [signature]);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (row.current && !row.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown, true);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("mousedown", onDown, true);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [open]);

  if (!shown.length) return null;
  const rest = shown.slice(fit);
  return (
    <div className="openui-dashboard-legend" role="list" ref={row}>
      {shown.map((entry, i) => (
        <span
          key={`${entry.name}-${entry.dashed ? "prev" : entry.dotted ? "ref" : "cur"}`}
          className={
            i < fit
              ? "openui-dashboard-legend-item"
              : "openui-dashboard-legend-item openui-dashboard-legend-overflow"
          }
          role="listitem"
          aria-hidden={i < fit ? undefined : true}
          onMouseEnter={onHover ? () => onHover(entry.name) : undefined}
          onMouseLeave={onHover ? () => onHover(null) : undefined}
        >
          <LegendMark entry={entry} />
          {entry.name}
        </span>
      ))}
      {rest.length ? (
        <span className="openui-dashboard-legend-more-anchor">
          <button
            type="button"
            className="openui-dashboard-legend-more"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            More
            <span className="openui-dashboard-filter-caret" aria-hidden />
          </button>
          {open ? (
            <span className="openui-dashboard-legend-menu" role="list">
              {rest.map((entry) => (
                <span key={entry.name} className="openui-dashboard-legend-item" role="listitem">
                  <LegendMark entry={entry} />
                  {entry.name}
                </span>
              ))}
            </span>
          ) : null}
        </span>
      ) : null}
    </div>
  );
}

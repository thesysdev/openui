"use client";
import { useState } from "react";
import { Legend } from "../../../components/shared/Legend";
import { Empty } from "../../../components/shared/States";
import { TooltipCard } from "../../../components/shared/TooltipCard";
import { useWidth } from "../../../shared/hooks";
import { toStrings } from "../../../shared/values";

export interface StatusTimelineProps {
  labels: string[];
  states: string[][];
  periods?: string[];
}

/** The smallest StatusTimeline cell, in px: below it texture and hover stop working, so the strips scroll instead. */
const ST_CELL_MIN = 8;

const STATUS = {
  up: { label: "Up", color: "var(--openui-dashboard-good-mark)" },
  degraded: { label: "Degraded", color: "var(--openui-dashboard-warning-mark)" },
  down: { label: "Down", color: "var(--openui-dashboard-bad-mark)" },
} as const;
const NO_DATA = "color-mix(in srgb, var(--openui-dashboard-ink) 8%, transparent)";

export function StatusTimeline(props: StatusTimelineProps) {
  const labels = toStrings(props.labels);
  const states = (Array.isArray(props.states) ? props.states : []).map((row) => toStrings(row));
  const periods = toStrings(props.periods);
  const [hover, setHover] = useState<{ row: number; period: number } | null>(null);
  const [gridRef, gridWidth] = useWidth();
  if (!labels.length || !states.length) return <Empty />;
  const count = Math.max(...states.map((row) => row.length));
  // Cells never shrink under ST_CELL_MIN: past that, the strips keep a minimum width and
  // scroll sideways together (label | cells | uptime, with the 14px gaps and 3px between cells).
  const need = 110 + 14 + count * (ST_CELL_MIN + 3) - 3 + 14 + 64;
  const scroll = gridWidth > 0 && need > gridWidth;
  // State reads by texture as well as colour: up is dotted, degraded slashed, down back-slashed.
  const texture = {
    up: " openui-dashboard-tex-0",
    degraded: " openui-dashboard-tex-1",
    down: " openui-dashboard-tex-2",
  } as const;

  return (
    <div className="openui-dashboard-st" ref={gridRef} data-scroll={scroll ? "" : undefined}>
      <Legend
        entries={[
          ...Object.values(STATUS).map((s) => ({ name: s.label, color: s.color })),
          { name: "No data", color: NO_DATA },
        ]}
      />
      <div className="openui-dashboard-st-strips" style={scroll ? { minWidth: need } : undefined}>
        {labels.map((label, r) => {
          const row = states[r] ?? [];
          const known = row.filter((state) => state in STATUS);
          const up = known.filter((state) => state === "up").length;
          const tipState = hover?.row === r ? row[hover.period] : undefined;
          const tipStatus =
            tipState !== undefined && tipState in STATUS
              ? STATUS[tipState as keyof typeof STATUS]
              : null;
          return (
            <div key={`${r}-${label}`} className="openui-dashboard-st-row">
              <span className="openui-dashboard-st-label" title={label}>
                {label}
              </span>
              {/* One listener per strip, not per cell: the cell under the pointer names its period. */}
              <div
                className="openui-dashboard-st-cells"
                onMouseOver={(event) => {
                  const p = (event.target as HTMLElement).dataset["period"];
                  if (p !== undefined)
                    setHover((current) =>
                      current?.row === r && current.period === Number(p)
                        ? current
                        : { row: r, period: Number(p) },
                    );
                }}
                onMouseLeave={() => setHover(null)}
              >
                {Array.from({ length: count }, (_, p) => {
                  const state = row[p] as keyof typeof STATUS | undefined;
                  const status = state && state in STATUS ? STATUS[state] : null;
                  const active = hover?.row === r && hover.period === p;
                  return (
                    <span
                      key={p}
                      data-period={p}
                      className={`openui-dashboard-st-cell${state && state in STATUS ? texture[state] : ""}`}
                      aria-label={`${label} · ${periods[p] ?? `#${p + 1}`}: ${status ? status.label : "No data"}`}
                      style={{
                        backgroundColor: status ? status.color : NO_DATA,
                        opacity: hover && !active ? 0.75 : 1,
                      }}
                    />
                  );
                })}
                {hover?.row === r ? (
                  <div
                    className="openui-dashboard-st-tip"
                    style={{ left: `${((hover.period + 0.5) / count) * 100}%` }}
                  >
                    {/* A state, not a number: the row names it and prints no value. */}
                    <TooltipCard
                      title={`${label} · ${periods[hover.period] ?? `#${hover.period + 1}`}`}
                      rows={[
                        {
                          name: tipStatus ? tipStatus.label : "No data",
                          color: tipStatus ? tipStatus.color : NO_DATA,
                          value: null,
                          text: null,
                        },
                      ]}
                    />
                  </div>
                ) : null}
              </div>
              <span className="openui-dashboard-st-value">
                {known.length ? `${((up / known.length) * 100).toFixed(1)}%` : "—"}
              </span>
            </div>
          );
        })}
        {/* The axis row names the uptime column, with or without period labels. */}
        <div className="openui-dashboard-st-row openui-dashboard-st-axis">
          <span />
          <span className="openui-dashboard-st-ends">
            <span>{periods[0] ?? ""}</span>
            <span>{periods.length > 1 ? periods[periods.length - 1] : ""}</span>
          </span>
          <span className="openui-dashboard-st-value">Uptime</span>
        </div>
      </div>
    </div>
  );
}

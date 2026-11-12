"use client";
import { useState } from "react";
import { divergingColor, sequentialColor } from "../../../shared/colors";
import { columnDecimals, formatValue, padDecimals, type ValueFormat } from "../../../shared/format";
import { toNumbers, toStrings } from "../../../shared/values";
import { RampKey } from "../../shared/RampKey";
import { useRowHover } from "../../shared/RowHover";
import { Empty } from "../../shared/States";
import { TooltipCard } from "../../shared/TooltipCard";
import { ViewSwitch } from "../../shared/ViewSwitch";
type HeatmapView = "count" | "total" | "row";
const HEATMAP_VIEWS: { value: HeatmapView; label: string }[] = [
  { value: "count", label: "Count" },
  { value: "total", label: "% of total" },
  { value: "row", label: "% of row" },
];
/** What the cells print: nothing (the default), or a reading. */
type HeatmapShow = "none" | HeatmapView;

export interface HeatmapProps {
  rows: string[];
  columns: string[];
  values: (number | null)[][];
  format?: ValueFormat;
  showValues?: boolean;
  midpoint?: number;
  view?: "count" | "total" | "row";
}
// ---------- Heatmap: two categorical axes ----------
export function Heatmap(props: HeatmapProps) {
  const hover = useRowHover();
  // One Show switch: None (the default) prints nothing; Count, % of total or % of row prints that
  // reading and colours by it. showValues opens on view (count when not given).
  const [showChoice, setShow] = useState<HeatmapShow | null>(null);
  const showing: HeatmapShow = showChoice ?? (props.showValues ? (props.view ?? "count") : "none");
  const view: HeatmapView = showing === "none" ? (props.view ?? "count") : showing;
  const valuesOn = showing !== "none";
  const rowLabels = toStrings(props.rows);
  const columnLabels = toStrings(props.columns);
  const grid = (Array.isArray(props.values) ? props.values : []).map((row) => toNumbers(row));
  const cells = grid.flat().filter((value): value is number => value !== null);
  if (!rowLabels.length || !columnLabels.length || !cells.length) return <Empty />;
  // Diverging: symmetric around the midpoint, so equal distances read equally.
  const midpoint = props.midpoint ?? undefined;
  // Counts can also read as a share of the whole grid or of their row; a diverging (signed) grid can't.
  const switchable = midpoint === undefined && cells.every((value) => value >= 0);
  const shown: HeatmapView = switchable ? view : "count";
  const total = cells.reduce((sum, value) => sum + value, 0) || 1;
  const rowTotal = (r: number) =>
    (grid[r] ?? []).reduce<number>((sum, value) => sum + (value ?? 0), 0) || 1;
  const read = (value: number, r: number) =>
    shown === "total"
      ? (value / total) * 100
      : shown === "row"
        ? (value / rowTotal(r)) * 100
        : value;
  const format = shown === "count" ? props.format : "percent";
  const readings = grid.flatMap((row, r) =>
    row.filter((value): value is number => value !== null).map((value) => read(value, r)),
  );
  const min = Math.min(...readings);
  const max = Math.max(...readings);
  const spread =
    midpoint === undefined ? 0 : Math.max(...cells.map((value) => Math.abs(value - midpoint)));
  const colorFor = (reading: number) =>
    midpoint === undefined
      ? sequentialColor(reading, min, max)
      : divergingColor(reading, midpoint, spread);
  // Printed values keep one precision across the grid: 4.0 beside 3.4.
  const places = columnDecimals(
    readings.map((reading) => formatValue(Math.abs(reading), format, { axis: true })),
  );
  const cellText = (reading: number) =>
    padDecimals(formatValue(reading, format, { axis: true }), places);
  // The label column fits the longest row label ("Mon", "2026-09-07 · n=1,204")
  // at about 7px a character plus its padding, from 48px up to 200px; longer
  // labels end in an ellipsis. A <col> takes plain lengths only: min() or
  // calc() there is ignored.
  const longest = Math.max(...rowLabels.map((label) => label.length));
  const labelWidth = Math.min(Math.max(longest * 7 + 20, 48), 200);
  const dot = <span className="openui-dashboard-tip-dot" />;
  return (
    // The kit tooltip on every cell, as on every other chart; the hovered cell takes an ink ring.
    <div ref={hover.ref} className="openui-dashboard-rows openui-dashboard-grid-hover">
      <ViewSwitch
        label="Show in cells"
        prefix="Show"
        // A diverging grid has one reading, so it only prints its values or not.
        options={[
          { value: "none" as HeatmapShow, label: "None" },
          ...(switchable ? HEATMAP_VIEWS : [{ value: "count" as HeatmapView, label: "Values" }]),
        ]}
        value={switchable ? showing : showing === "none" ? "none" : "count"}
        onChange={setShow}
      />
      <RampKey
        low={formatValue(midpoint === undefined ? min : midpoint - spread, format, {
          axis: true,
        })}
        high={formatValue(midpoint === undefined ? max : midpoint + spread, format, {
          axis: true,
        })}
        ramp={midpoint === undefined ? "seq" : "div"}
      />
      <div className="openui-dashboard-cohort-wrap">
        <table
          className="openui-dashboard-cohort openui-dashboard-heat"
          style={{ borderSpacing: 2, tableLayout: "fixed" }}
        >
          {/* Fixed layout keeps every hour or day column the same width. */}
          <colgroup>
            <col style={{ width: labelWidth }} />
            {columnLabels.map((column) => (
              <col key={column} />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th />
              {columnLabels.map((column) => (
                <th key={column} style={{ fontSize: 11, textAlign: "center" }}>
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rowLabels.map((row, r) => (
              <tr key={row}>
                {/* No browser tooltip here: a cell's kit tooltip names its row. */}
                <td
                  className="openui-dashboard-cohort-label"
                  style={{ paddingRight: 8, overflow: "hidden", textOverflow: "ellipsis" }}
                >
                  {row}
                </td>
                {columnLabels.map((column, c) => {
                  const value = grid[r]?.[c] ?? null;
                  if (value === null)
                    return <td key={column} className="openui-dashboard-cohort-empty" />;
                  const reading = read(value, r);
                  const { background, color } = colorFor(reading);
                  // Nearly square cells; only the grid's four outer corners take a real radius.
                  const corner = "calc(var(--openui-dashboard-radius-sm) - 2px)";
                  const last = { r: rowLabels.length - 1, c: columnLabels.length - 1 };
                  return (
                    <td
                      key={column}
                      style={{
                        backgroundColor: background,
                        color,
                        height: 24,
                        minWidth: 24,
                        fontSize: 11,
                        borderTopLeftRadius: r === 0 && c === 0 ? corner : undefined,
                        borderTopRightRadius: r === 0 && c === last.c ? corner : undefined,
                        borderBottomLeftRadius: r === last.r && c === 0 ? corner : undefined,
                        borderBottomRightRadius: r === last.r && c === last.c ? corner : undefined,
                      }}
                      {...hover.rowProps(`${row}-${column}`, () => (
                        // Every reading in the tooltip, whichever the switch shows.
                        <TooltipCard
                          title={`${row} · ${column}`}
                          format={props.format}
                          rows={[
                            { name: "Value", color: background, value },
                            ...(switchable
                              ? [
                                  {
                                    name: "Share of total",
                                    color: "transparent",
                                    value: (value / total) * 100,
                                    format: "percent" as const,
                                    mark: dot,
                                  },
                                  {
                                    name: `Share of ${row}`,
                                    color: "transparent",
                                    value: (value / rowTotal(r)) * 100,
                                    format: "percent" as const,
                                    mark: dot,
                                  },
                                ]
                              : []),
                          ]}
                        />
                      ))}
                    >
                      {valuesOn ? cellText(reading) : ""}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {hover.tip}
    </div>
  );
}

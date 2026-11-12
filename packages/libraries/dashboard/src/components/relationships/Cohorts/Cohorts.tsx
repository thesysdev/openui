"use client";
import { useState } from "react";
import { sequentialColor } from "../../../shared/colors";
import { columnDecimals, formatValue, padDecimals, type ValueFormat } from "../../../shared/format";
import { toNumbers, toStrings } from "../../../shared/values";
import { RampKey } from "../../shared/RampKey";
import { useRowHover } from "../../shared/RowHover";
import { Empty } from "../../shared/States";
import { TooltipCard } from "../../shared/TooltipCard";
import { ViewSwitch } from "../../shared/ViewSwitch";
type CohortView = "percent" | "people";
const COHORT_VIEWS: { value: CohortView; label: string }[] = [
  { value: "percent", label: "Percent" },
  { value: "people", label: "Count" },
];
type CohortShow = "none" | CohortView;

export interface CohortsProps {
  cohorts: string[];
  periods: string[];
  values: (number | null)[][];
  sizes: (number | null)[];
  format?: ValueFormat;
  view?: "percent" | "people";
  showValues?: boolean;
}
// ---------- Cohorts: retention grid ----------
export function Cohorts(props: CohortsProps) {
  const hover = useRowHover();
  // One Show switch, as on Heatmap: None (the default), Percent, or Count (people: size × rate).
  // showValues opens on view (percent when not given). Colour always follows the rate.
  const [showChoice, setShow] = useState<CohortShow | null>(null);
  const showing: CohortShow = showChoice ?? (props.showValues ? (props.view ?? "percent") : "none");
  const view: CohortView = showing === "none" ? "percent" : showing;
  const valuesOn = showing !== "none";
  const cohorts = toStrings(props.cohorts);
  const sizes = toNumbers(props.sizes);
  const periods = toStrings(props.periods);
  const rows = (Array.isArray(props.values) ? props.values : []).map((row) => toNumbers(row));
  const format = props.format ?? "percent";
  // Scale colour over the non-trivial cells so period 0 (100%) doesn't flatten the ramp.
  const cells = rows
    .flatMap((row) => row.slice(1))
    .filter((value): value is number => value !== null);
  if (!cohorts.length || !periods.length) return <Empty />;
  const min = cells.length ? Math.min(...cells) : 0;
  const max = cells.length ? Math.max(...cells) : 100;
  const sized = format === "percent" && sizes.some((size) => typeof size === "number");
  // All cohorts: each period's retention weighted by cohort size, over the cohorts that have reached it.
  const all = sized
    ? periods.map((_, j) => {
        const reached = cohorts
          .map((_, i) => ({ size: sizes[i], value: rows[i]?.[j] ?? null }))
          .filter(
            (c): c is { size: number; value: number } =>
              typeof c.size === "number" && c.value !== null,
          );
        const people = reached.reduce((sum, c) => sum + c.size, 0);
        return people ? reached.reduce((sum, c) => sum + c.size * c.value, 0) / people : null;
      })
    : null;
  const totalSize = sizes.reduce<number>((sum, size) => sum + (size ?? 0), 0);
  // One precision down each period's column: 28.0% under 27.1%.
  const places = periods.map((_, j) =>
    columnDecimals(
      [...rows.map((row) => row[j] ?? null), all?.[j] ?? null]
        .filter((v): v is number => v !== null)
        .map((v) => formatValue(Math.round(v * 10) / 10, format)),
    ),
  );
  const reachedSize = (j: number) =>
    cohorts.reduce(
      (sum, _, i) =>
        sum + (rows[i]?.[j] !== null && rows[i]?.[j] !== undefined ? (sizes[i] ?? 0) : 0),
      0,
    );

  // Real corners only at the outer corners: the All cohorts strip's two ends, and the cohort grid's
  // top-left, top-right and bottom-left (the grid is a triangle, so its own last cells end each row).
  const corner = "calc(var(--openui-dashboard-radius-sm) - 2px)";
  const lastPeriod = periods.length - 1;
  const lastCohort = cohorts.length - 1;
  const corners = (key: string, j: number) => {
    const row = key === "all" ? -1 : cohorts.indexOf(key);
    const first = j === 0;
    const end = j === lastPeriod;
    if (row === -1)
      return {
        borderTopLeftRadius: first ? corner : undefined,
        borderBottomLeftRadius: first ? corner : undefined,
        borderTopRightRadius: end ? corner : undefined,
        borderBottomRightRadius: end ? corner : undefined,
      };
    return {
      borderTopLeftRadius: row === 0 && first ? corner : undefined,
      borderTopRightRadius: row === 0 && end ? corner : undefined,
      borderBottomLeftRadius: row === lastCohort && first ? corner : undefined,
      borderBottomRightRadius: row === lastCohort && end ? corner : undefined,
    };
  };
  const cell = (
    key: string,
    label: string,
    period: string,
    j: number,
    value: number | null,
    size: number | null,
  ) => {
    if (value === null)
      return (
        <td
          key={period}
          className="openui-dashboard-cohort-empty"
          aria-label="Not reached yet"
          style={corners(key, j)}
        />
      );
    const { background, color } =
      j === 0
        ? {
            background: "var(--openui-dashboard-surface-subtle)",
            color: "var(--openui-dashboard-ink)",
          }
        : sequentialColor(value, min, max);
    const people =
      typeof size === "number" && format === "percent" ? Math.round((size * value) / 100) : null;
    return (
      <td
        key={period}
        style={{ backgroundColor: background, color, ...corners(key, j) }}
        {...hover.rowProps(`${key}-${period}`, () => (
          <TooltipCard
            title={`${label} · ${period}`}
            format={format}
            rows={[
              { name: "Retained", color: background, value },
              ...(people !== null
                ? [
                    {
                      name: "People",
                      color: "transparent",
                      value: people,
                      format: "number" as const,
                      mark: <span className="openui-dashboard-tip-dot" />,
                    },
                  ]
                : []),
              ...(typeof size === "number"
                ? [
                    {
                      name: "Cohort size",
                      color: "transparent",
                      value: size,
                      format: "number" as const,
                      mark: <span className="openui-dashboard-tip-dot" />,
                    },
                  ]
                : []),
            ]}
          />
        ))}
      >
        {!valuesOn
          ? ""
          : view === "people" && people !== null
            ? formatValue(people, "number", { axis: true })
            : padDecimals(formatValue(value, format), places[j] ?? 0)}
      </td>
    );
  };

  return (
    // The kit tooltip on every cell, as on every other chart; the hovered cell takes an ink ring.
    <div ref={hover.ref} className="openui-dashboard-rows openui-dashboard-grid-hover">
      {/* People only makes sense for rates of a known size. */}
      <ViewSwitch
        label="Show in cells"
        prefix="Show"
        // Without cohort sizes there are no people to count, so only Percent.
        options={[
          { value: "none" as CohortShow, label: "None" },
          ...(sized ? COHORT_VIEWS : COHORT_VIEWS.slice(0, 1)),
        ]}
        // Not in his source: without sizes, view "people" still prints percent, so the switch
        // says so instead of showing no choice.
        value={sized || showing === "none" ? showing : "percent"}
        onChange={setShow}
      />
      {/* The same colour key as Heatmap: what the ramp means, from the lowest retention after period 0 to the highest. */}
      {cells.length ? (
        <RampKey low={formatValue(min, format)} high={formatValue(max, format)} ramp="seq" />
      ) : null}
      <div className="openui-dashboard-cohort-wrap">
        {/* Fixed layout, as on Heatmap: printing values (the Show switch) never resizes a column. */}
        <table className="openui-dashboard-cohort" style={{ tableLayout: "fixed" }}>
          <colgroup>
            <col
              style={{
                width: Math.min(
                  Math.max(Math.max(11, ...cohorts.map((c) => c.length)) * 7 + 20, 64),
                  200,
                ),
              }}
            />
            <col
              style={{ width: Math.max(56, formatValue(totalSize, "number").length * 7 + 20) }}
            />
            {periods.map((period) => (
              <col key={period} />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th>Cohort</th>
              <th>Size</th>
              {periods.map((period) => (
                <th key={period}>{period}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {all ? (
              // The most-read row of a retention table, first: every cohort together, weighted by size.
              <tr className="openui-dashboard-cohort-all">
                <td className="openui-dashboard-cohort-label">All cohorts</td>
                <td className="openui-dashboard-cohort-size">{formatValue(totalSize, "number")}</td>
                {periods.map((period, j) =>
                  cell(
                    "all",
                    "All cohorts",
                    period,
                    j,
                    all[j] === null ? null : Math.round((all[j] as number) * 10) / 10,
                    reachedSize(j),
                  ),
                )}
              </tr>
            ) : null}
            {all ? (
              <tr className="openui-dashboard-cohort-gap" aria-hidden>
                <td colSpan={periods.length + 2} />
              </tr>
            ) : null}
            {cohorts.map((cohort, i) => (
              <tr key={cohort}>
                <td className="openui-dashboard-cohort-label">{cohort}</td>
                <td className="openui-dashboard-cohort-size">{formatValue(sizes[i], "number")}</td>
                {periods.map((period, j) =>
                  cell(cohort, cohort, period, j, rows[i]?.[j] ?? null, sizes[i] ?? null),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {hover.tip}
    </div>
  );
}

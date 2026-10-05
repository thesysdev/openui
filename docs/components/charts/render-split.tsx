"use client";

import {
  FORMATS,
  FORMAT_ORDER,
  type FormatId,
  MODELS,
  type ModelId,
  RUNS_PER_FORMAT,
  formatLabel,
  runCounts,
} from "@/lib/benchmark-data";
import { Chart, ChartDataDisclosure, Chip, DataTable, styles as s, slotClass } from "./primitives";

/* Every run ends complete, partial, or blank. Each column keeps its natural
   direction — a long "complete" bar is good, a long "blank" bar is not — and
   the arrow colour, not the bar length, is what says better or worse. */
const totals = (id: FormatId, models: readonly ModelId[]) =>
  models.reduce(
    (acc, m) => {
      const c = runCounts[m][id];
      return {
        runs: acc.runs + c.runs,
        complete: acc.complete + c.complete,
        partial: acc.partial + (c.renderable - c.complete),
        blank: acc.blank + (c.runs - c.renderable),
      };
    },
    { runs: 0, complete: 0, partial: 0, blank: 0 },
  );

/* The positive side of each failure mode, so a longer bar is always better.
   Both cluster near 100%, so each column gets a truncated floor — disclosed in
   the subtitle — or all three bars would look the same length. */
const COLS = [
  { key: "inFull", label: "Structural validity", floor: 75 },
  { key: "atAll", label: "Render success", floor: 95 },
] as const;

export function RenderSplit({
  models,
  formats = FORMAT_ORDER,
}: {
  models?: readonly ModelId[];
  formats?: readonly FormatId[];
} = {}) {
  const selected = models ?? MODELS.map((m) => m.id);
  const shown = FORMAT_ORDER.filter((f) => formats.includes(f));

  const rates = (id: FormatId) => {
    const t = totals(id, selected);
    return {
      /* every numbered requirement rendered */
      inFull: (t.complete / t.runs) * 100,
      /* something rendered, complete or not */
      atAll: ((t.runs - t.blank) / t.runs) * 100,
      counts: t,
    };
  };
  const baseline = rates("openui");

  return (
    <Chart
      title="Structural validity and render success"
      sub={`Share of ${RUNS_PER_FORMAT.toLocaleString()} runs per format; longer is better. Scales start at ${COLS[0].floor}% and ${COLS[1].floor}%, not zero. Arrows compare with OpenUI.`}
      note={
        <>
          <strong>What counts as valid.</strong>&#32;Parses, has a root, every reference resolves,
          nothing orphaned or invented, no missing or out-of-range props, not truncated, and at
          least as many components as the brief has requirements. That last one is a count floor,
          not a check that each requirement was addressed: this measures structure, not coverage.
        </>
      }
    >
      <div className={`${s.matrix} ${s.matrixPair}`}>
        <div className={s.matrixHead} aria-hidden>
          <span />
          {COLS.map((c) => (
            <span key={c.key}>{c.label}</span>
          ))}
        </div>
        {shown.map((id, ri) => {
          const f = FORMATS.find((x) => x.id === id)!;
          const r = rates(id);
          return (
            <div
              key={id}
              className={`${s.matrixRow} ${slotClass(f.series)} ${s.tip}`}
              data-tip={`${formatLabel(id)}: ${r.counts.complete.toLocaleString()} rendered in full, ${(r.counts.runs - r.counts.blank).toLocaleString()} rendered at all, of ${r.counts.runs.toLocaleString()} runs (${r.counts.partial} partial, ${r.counts.blank} blank)`}
            >
              <span className={s.tokenName}>
                <Chip mark={f.mark} />
                <span>{f.label}</span>
              </span>
              {COLS.map((c) => {
                const delta = r[c.key] - baseline[c.key];
                const better = delta > 0;
                return (
                  <span key={c.key} className={`${s.matrixCell} ${s.matrixCellDiff}`}>
                    <span className={s.matrixBarWrap}>
                      <span
                        className={`${s.matrixBar} ${
                          id === "openui"
                            ? s.colBarOurs
                            : id === "a2ui"
                              ? s.colBarStriped
                              : s.colBarStripedLight
                        }`}
                        style={
                          {
                            width: `${Math.max(((r[c.key] - c.floor) / (100 - c.floor)) * 100, 2)}%`,
                            "--d": `${ri * 90}ms`,
                          } as React.CSSProperties
                        }
                      />
                    </span>
                    <span className={s.matrixVal}>{r[c.key].toFixed(1)}%</span>
                    <span className={s.matrixDiff}>
                      {id !== "openui" && shown.includes("openui") ? (
                        <span className={better ? s.diffGood : s.diffBad}>
                          {delta > 0 ? "↑" : "↓"}
                          {Math.abs(delta).toFixed(1)}
                        </span>
                      ) : null}
                    </span>
                  </span>
                );
              })}
            </div>
          );
        })}
      </div>
      <ChartDataDisclosure label="View validity and render data">
        <DataTable>
          <caption>Structural validity and render success by format</caption>
          <thead>
            <tr>
              <th scope="col">Format</th>
              <th scope="col" data-numeric="true">
                Valid runs
              </th>
              <th scope="col" data-numeric="true">
                Partial runs
              </th>
              <th scope="col" data-numeric="true">
                Blank runs
              </th>
              <th scope="col" data-numeric="true">
                Validity
              </th>
              <th scope="col" data-numeric="true">
                Render success
              </th>
            </tr>
          </thead>
          <tbody>
            {shown.map((format) => {
              const row = rates(format);
              return (
                <tr key={`data-${format}`}>
                  <th scope="row">{formatLabel(format)}</th>
                  <td data-numeric="true">{row.counts.complete}</td>
                  <td data-numeric="true">{row.counts.partial}</td>
                  <td data-numeric="true">{row.counts.blank}</td>
                  <td data-numeric="true">{row.inFull.toFixed(1)}%</td>
                  <td data-numeric="true">{row.atAll.toFixed(1)}%</td>
                </tr>
              );
            })}
          </tbody>
        </DataTable>
      </ChartDataDisclosure>
    </Chart>
  );
}

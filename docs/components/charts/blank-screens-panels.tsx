"use client";

import {
  FORMATS,
  FORMAT_ORDER,
  type FormatId,
  MODELS,
  type ModelId,
  blanksOver,
  formatLabel,
  runsFor,
} from "@/lib/benchmark-data";
import {
  Chart,
  ChartDataDisclosure,
  Chip,
  DataTable,
  Mark,
  styles as s,
  slotClass,
} from "./primitives";

/* Render rate per model, one panel per format. Framed as the share of runs
   that put a screen in front of the user, so OpenUI's near-perfect
   record reads as tall bars instead of near-empty ones. The scale starts at
   RATE_MIN, not zero, and the section copy says so. */
const RATE_MIN = 88;

const fullName = (m: (typeof MODELS)[number]) =>
  "family" in m && m.family ? `${m.family} ${m.label}` : m.label;

export function BlankScreensPanels({
  models,
  formats = FORMAT_ORDER,
}: {
  models?: readonly ModelId[];
  formats?: readonly FormatId[];
}) {
  const selected = models ?? MODELS.map((m) => m.id);
  const shownFormats = FORMAT_ORDER.filter((f) => formats.includes(f));
  const rate = (f: FormatId, m: ModelId) => (1 - blanksOver(f, [m]) / runsFor(m)) * 100;

  return (
    <Chart
      title="Render rate"
      sub="Runs that rendered against runs that came back blank, out of 184 per model."
    >
      <div className={s.panelGrid}>
        {shownFormats.map((f) => {
          const format = FORMATS.find((x) => x.id === f)!;
          const active = MODELS.filter((m) => selected.includes(m.id));
          const formatRate =
            active.reduce((sum, m) => sum + rate(f, m.id), 0) / Math.max(1, active.length);
          return (
            <div key={f} className={`${s.panel} ${slotClass(format.series)}`}>
              <div className={s.panelHead}>
                <span className={s.panelName}>{formatLabel(f)}</span>
                <span className={s.panelRate}>{formatRate.toFixed(1)}%</span>
              </div>
              <div className={s.panelPlot}>
                {MODELS.map((m, i) => {
                  const v = rate(f, m.id);
                  const blanks = blanksOver(f, [m.id]);
                  const ghost = !selected.includes(m.id);
                  const h = Math.max(((v - RATE_MIN) / (100 - RATE_MIN)) * 88, 2);
                  return (
                    <div
                      key={m.id}
                      className={`${s.colCell} ${s.tip} ${ghost ? s.colCellGhost : ""}`}
                      data-tip={`${formatLabel(f)} · ${fullName(m)}: ${v.toFixed(1)}% rendered, ${blanks} blank of ${runsFor(m.id)}`}
                    >
                      {/* the space above the bar is the blank share: filled and
                          counted, rather than left as an empty gap */}
                      {ghost ? null : (
                        <span
                          className={s.colTop}
                          style={
                            {
                              height: `${100 - h}%`,
                              "--d": `${i * 55}ms`,
                            } as React.CSSProperties
                          }
                        >
                          <span className={s.colTopVal}>{blanks}</span>
                        </span>
                      )}
                      <span
                        className={`${s.colBar} ${
                          f === "openui"
                            ? s.colBarOurs
                            : f === "a2ui"
                              ? s.colBarStriped
                              : s.colBarStripedLight
                        }`}
                        style={
                          {
                            height: `${ghost ? 0 : h}%`,
                            "--d": `${i * 55}ms`,
                          } as React.CSSProperties
                        }
                      >
                        {ghost ? null : (
                          <span className={s.colBarVal}>{runsFor(m.id) - blanks}</span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className={s.panelFeet}>
                {MODELS.map((m) => (
                  <span
                    key={m.id}
                    className={`${s.panelFoot} ${selected.includes(m.id) ? "" : s.panelFootGhost}`}
                    title={fullName(m)}
                    aria-label={fullName(m)}
                  >
                    <Chip mark={m.mark} />
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div className={`${s.legend} ${s.legendCenter}`} aria-label="Segment key">
        <span className={s.key}>
          <span className={`${s.dot} ${s.dotComplete}`} aria-hidden />
          Rendered
        </span>
        <span className={s.key}>
          <span className={`${s.dot} ${s.dotTop}`} aria-hidden />
          Came back blank
        </span>
      </div>
      <div className={`${s.legend} ${s.legendCenter}`} aria-label="Model key">
        {MODELS.map((m) => (
          <span key={m.id} className={s.key}>
            <Mark id={m.mark} />
            {fullName(m)}
          </span>
        ))}
      </div>
      <ChartDataDisclosure label="View render data">
        <DataTable>
          <caption>Rendered and blank runs for every model and generative UI format</caption>
          <thead>
            <tr>
              <th scope="col">Model</th>
              <th scope="col">Format</th>
              <th scope="col" data-numeric="true">
                Rendered
              </th>
              <th scope="col" data-numeric="true">
                Blank
              </th>
              <th scope="col" data-numeric="true">
                Render rate
              </th>
            </tr>
          </thead>
          <tbody>
            {shownFormats.flatMap((format) =>
              MODELS.filter((model) => selected.includes(model.id)).map((model) => {
                const blanks = blanksOver(format, [model.id]);
                const runs = runsFor(model.id);
                return (
                  <tr key={`data-${format}-${model.id}`}>
                    <th scope="row">{fullName(model)}</th>
                    <td>{formatLabel(format)}</td>
                    <td data-numeric="true">{runs - blanks}</td>
                    <td data-numeric="true">{blanks}</td>
                    <td data-numeric="true">{rate(format, model.id).toFixed(1)}%</td>
                  </tr>
                );
              }),
            )}
          </tbody>
        </DataTable>
      </ChartDataDisclosure>
    </Chart>
  );
}

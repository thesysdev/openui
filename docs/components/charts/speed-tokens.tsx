"use client";

import { FORMATS, FORMAT_ORDER, type FormatId, tokens } from "@/lib/benchmark-data";
import { Chart, ChartDataDisclosure, DataTable, Row, styles as s, slotClass } from "./primitives";

/* Streaming speed, derived from the current benchmark: the mean output per
   screen over all 1,104 scored runs, decoded at a fixed 50 tokens per second. */
const DECODE_TPS = 50;

export function SpeedTokens({ note }: { note?: React.ReactNode | null } = {}) {
  const secs = (id: FormatId) => tokens.outputPerScreen[id] / DECODE_TPS;
  const baseline = secs("openui");
  const max = Math.max(...FORMAT_ORDER.map(secs));
  return (
    <Chart
      title="Time to stream a screen"
      sub="Mean output per screen, decoded at 50 tokens per second."
      note={
        note !== undefined ? (
          note
        ) : (
          <>
            Derived, not wall-clock: mean output over {tokens.outputBasis.runs.toLocaleString()}
            &#32;scored runs, at a fixed {DECODE_TPS}
            &#32;tokens/second decode rate.
          </>
        )
      }
    >
      <div className={s.rows}>
        {FORMAT_ORDER.map((id, i) => {
          const f = FORMATS.find((x) => x.id === id)!;
          const out = tokens.outputPerScreen[id];
          return (
            <Row
              key={id}
              label={f.label}
              tip={`${f.label}: ${out.toLocaleString()} output tokens ≈ ${Math.round(out / DECODE_TPS)}s per screen at ${DECODE_TPS} tok/s`}
            >
              <span className={s.barSlot}>
                <span
                  className={`${s.bar} ${slotClass(f.series)} ${
                    id === "openui"
                      ? s.colBarOurs
                      : id === "a2ui"
                        ? s.colBarStriped
                        : s.colBarStripedLight
                  }`}
                  style={
                    {
                      width: `${(secs(id) / max) * 88}%`,
                      "--d": `${i * 90}ms`,
                    } as React.CSSProperties
                  }
                />
              </span>
              <span
                className={`${s.value} ${s.speedValue} ${
                  id === "openui" ? `${s.valueHi} ${slotClass(1)}` : ""
                }`}
              >
                <span className={s.speedDiff}>
                  {id !== "openui" ? (
                    <span className={s.diffBad}>↑{(secs(id) / baseline).toFixed(1)}×</span>
                  ) : null}
                </span>
                <span>~{Math.round(secs(id))}s</span>
              </span>
            </Row>
          );
        })}
      </div>
      <ChartDataDisclosure label="View streaming data">
        <DataTable>
          <caption>
            Estimated streaming time from mean output tokens at 50 tokens per second
          </caption>
          <thead>
            <tr>
              <th scope="col">Format</th>
              <th scope="col" data-numeric="true">
                Mean output tokens
              </th>
              <th scope="col" data-numeric="true">
                Decode rate
              </th>
              <th scope="col" data-numeric="true">
                Estimated seconds
              </th>
            </tr>
          </thead>
          <tbody>
            {FORMAT_ORDER.map((format) => (
              <tr key={`data-${format}`}>
                <th scope="row">{FORMATS.find((item) => item.id === format)!.label}</th>
                <td data-numeric="true">{tokens.outputPerScreen[format].toLocaleString()}</td>
                <td data-numeric="true">{DECODE_TPS} tok/s</td>
                <td data-numeric="true">{secs(format).toFixed(1)}s</td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      </ChartDataDisclosure>
    </Chart>
  );
}

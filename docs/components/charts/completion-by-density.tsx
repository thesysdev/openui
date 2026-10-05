"use client";

import {
  BRIEFS,
  FORMATS,
  FORMAT_ORDER,
  type FormatId,
  MODELS,
  type ModelId,
  completionByDensityFor,
} from "@/lib/benchmark-data";
import { useEffect, useRef, useState } from "react";
import {
  Chart,
  ChartDataDisclosure,
  DataTable,
  styles as s,
  slotClass,
  useVizSkin,
} from "./primitives";

/* Drawn at the container's real pixel width. the SVG never scales, so text
   is always its true size and the plot always fills the card. */
const H = 300;
const PAD = { top: 14, right: 54, bottom: 48, left: 34 };
const PH = H - PAD.top - PAD.bottom;

const hue = { 1: "var(--c1)", 2: "var(--c2)", 3: "var(--c3)" } as const;

/* the vivid skin colours all three lines, same palette as the frontier chart */
const frontierHue: Record<FormatId, string> = {
  openui: "var(--pO)",
  /* same greys as the bar charts, so the series read alike page-wide */
  a2ui: "var(--c2)",
  jsonRender: "var(--c3)",
};

export function CompletionByDensity({
  models,
  formats = FORMAT_ORDER,
  sub,
  note,
}: {
  models?: readonly ModelId[];
  formats?: readonly FormatId[];
  sub?: string;
  note?: React.ReactNode | null;
} = {}) {
  const { vivid } = useVizSkin();
  const completionByDensity = completionByDensityFor(models);
  const LAST = completionByDensity.length - 1;
  const finalValue = (id: FormatId) => completionByDensity[LAST][id];
  const shownFormats = FORMAT_ORDER.filter((f) => formats.includes(f));
  const modelCount = models?.length ?? MODELS.length;
  const holder = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(712);
  const [hover, setHover] = useState<{ i: number; id: FormatId } | null>(null);

  useEffect(() => {
    const el = holder.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setW(Math.max(320, Math.round(entry.contentRect.width)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const PW = W - PAD.left - PAD.right;
  const x = (i: number) => PAD.left + (i / LAST) * PW;
  /* extrapolated axis: the data lives between ~70 and ~98, so start at 65 */
  const Y_MIN = 65;
  const y = (v: number) => PAD.top + (1 - (v - Y_MIN) / (100 - Y_MIN)) * PH;

  /* square line-end tags, 20px tall; nudged apart when lines finish close */
  const placed = shownFormats
    .map((id) => ({ id, ty: y(finalValue(id)) }))
    .sort((a, b) => a.ty - b.ty);
  for (let i = 1; i < placed.length; i++) {
    if (placed[i].ty - placed[i - 1].ty < 22) placed[i].ty = placed[i - 1].ty + 22;
  }
  const tagY = Object.fromEntries(placed.map((p) => [p.id, p.ty])) as Record<FormatId, number>;

  return (
    <Chart
      title="Structural validity by screen complexity"
      sub={
        sub ??
        "The more a brief asks for, the less every format delivers. OpenUI and A2UI track each other closely at every size; json-render falls fastest and furthest."
      }
      note={
        note !== undefined ? (
          note
        ) : (
          <>
            {BRIEFS} briefs in 5 bands (10/10/10/8/8). ~9 briefs each, so read the slope, not the
            points. Pooled over{" "}
            {modelCount === MODELS.length
              ? "all six models"
              : `${modelCount} of ${MODELS.length} models`}{" "}
            at 184 runs per model per format ({completionByDensity[LAST].runs}–
            {completionByDensity[0].runs} runs per format per band).
          </>
        )
      }
    >
      <div
        ref={holder}
        className={`${s.svgHolder}${vivid ? ` ${s.frontier}` : ""}`}
        style={{ position: "relative" }}
      >
        <svg
          className={s.svg}
          width={W}
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label="Structural validity falls for all three formats as briefs ask for more"
        >
          {vivid
            ? completionByDensity.map((r, i) => {
                if (i % 2 === 1) return null;
                const x0 = i === 0 ? PAD.left : (x(i - 1) + x(i)) / 2;
                const x1 = i === LAST ? PAD.left + PW : (x(i) + x(Math.min(i + 1, LAST))) / 2;
                return (
                  <rect
                    key={`band-${r.band}`}
                    className={s.bandStripe}
                    x={x0}
                    width={Math.max(0, x1 - x0)}
                    y={PAD.top}
                    height={PH}
                  />
                );
              })
            : null}
          {[70, 80, 90, 100].map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={PAD.left + PW} y1={y(t)} y2={y(t)} stroke="var(--rule)" />
              <text
                x={PAD.left - 10}
                y={y(t) + 4}
                textAnchor="end"
                fontSize="13"
                fill="var(--ink-muted)"
              >
                {t}
              </text>
            </g>
          ))}

          {shownFormats.map((id) => {
            const slot = FORMATS.find((f) => f.id === id)!.series;
            const stroke = vivid ? frontierHue[id] : hue[slot];
            const pts = completionByDensity.map((r, i) => `${x(i)},${y(r[id])}`).join(" ");
            const label = `${finalValue(id).toFixed(0)}%`;
            const tagW = 12 + label.length * 8;
            return (
              <g key={id}>
                <polyline
                  className={s.line}
                  pathLength={1}
                  points={pts}
                  fill="none"
                  stroke={stroke}
                  strokeWidth="2"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  style={{ "--d": `${shownFormats.indexOf(id) * 110}ms` } as React.CSSProperties}
                />
                {vivid
                  ? completionByDensity.map((r, i) => (
                      <rect
                        key={`pt-${r.band}`}
                        className={s.pt}
                        x={x(i) - 4}
                        y={y(r[id]) - 4}
                        width={8}
                        height={8}
                        fill={id === "openui" ? "var(--surface)" : stroke}
                        stroke={stroke}
                        strokeWidth={id === "openui" ? 2.5 : 0}
                        style={
                          { cursor: "default", "--d": `${420 + i * 60}ms` } as React.CSSProperties
                        }
                        onMouseEnter={() => setHover({ i, id })}
                        onMouseLeave={() => setHover(null)}
                      />
                    ))
                  : null}
                <rect
                  className={s.fadeLate}
                  x={x(LAST) + 8}
                  y={tagY[id] - 10}
                  width={tagW}
                  height={20}
                  fill={stroke}
                />
                <text
                  x={x(LAST) + 8 + tagW / 2}
                  y={tagY[id] + 4.5}
                  textAnchor="middle"
                  className={`${s.endTag} ${s.fadeLate}`}
                  fill={
                    vivid && id === "a2ui"
                      ? "var(--surface)"
                      : vivid || id !== "jsonRender"
                        ? "#fff"
                        : "var(--ink)"
                  }
                >
                  {label}
                </text>
              </g>
            );
          })}

          {completionByDensity.map((r, i) => (
            <text
              key={r.band}
              x={x(i)}
              y={PAD.top + PH + 26}
              textAnchor="middle"
              fontSize="13"
              fill="var(--ink-muted)"
            >
              {r.band}
            </text>
          ))}
          <text x={PAD.left} y={PAD.top + PH + 46} fontSize="13" fill="var(--ink-muted)">
            requirements per screen
          </text>
        </svg>
        {hover ? (
          <div
            className={s.hoverCard}
            style={{
              left: Math.min(Math.max(x(hover.i), 80), W - 80),
              top: y(completionByDensity[hover.i][hover.id]) - 12,
            }}
          >
            <strong>
              {FORMATS.find((f) => f.id === hover.id)!.label} · {completionByDensity[hover.i].band}{" "}
              requirements
            </strong>
            {completionByDensity[hover.i][hover.id].toFixed(1)}% structurally valid ·{" "}
            {completionByDensity[hover.i].runs} runs
          </div>
        ) : null}
      </div>

      <div className={`${s.legend} ${s.legendCenter}${vivid ? ` ${s.frontier}` : ""}`}>
        {FORMATS.filter((f) => shownFormats.includes(f.id)).map((f) => (
          <span key={f.id} className={`${s.key} ${slotClass(f.series)}`}>
            <span
              className={s.dot}
              style={vivid ? { background: frontierHue[f.id] } : undefined}
              aria-hidden
            />
            {f.label}:&nbsp;<span className={s.legendVal}>{finalValue(f.id).toFixed(0)}%</span>
          </span>
        ))}
      </div>
      <ChartDataDisclosure label="View complexity data">
        <DataTable>
          <caption>Structural validity by brief requirement count and generative UI format</caption>
          <thead>
            <tr>
              <th scope="col">Requirements per screen</th>
              <th scope="col" data-numeric="true">
                Runs
              </th>
              {shownFormats.map((format) => (
                <th key={format} scope="col" data-numeric="true">
                  {FORMATS.find((item) => item.id === format)!.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {completionByDensity.map((row) => (
              <tr key={`data-${row.band}`}>
                <th scope="row">{row.band}</th>
                <td data-numeric="true">{row.runs}</td>
                {shownFormats.map((format) => (
                  <td key={format} data-numeric="true">
                    {row[format].toFixed(1)}%
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </DataTable>
      </ChartDataDisclosure>
    </Chart>
  );
}

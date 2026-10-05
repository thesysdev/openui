"use client";

import { production, repairFunnel } from "@/lib/benchmark-data";
import { useEffect, useRef, useState } from "react";
import { Chart, ChartDataDisclosure, DataTable, styles as s } from "./primitives";

/* Production repair as a step funnel: every stage shows how many screens are
   still broken, and the caption under each step says what fixed the rest.
   Page-only; the blog keeps the original segmented bar. */
const H = 260;
const TRANSITION = 110;

export function RepairFunnelFlow() {
  const holder = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(1080);

  useEffect(() => {
    const el = holder.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setW(Math.max(320, Math.round(entry.contentRect.width)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* Shares of every streaming generation, not of the failures alone: the
     honest read is that under 1% of screens reach a user broken. */
  const stages = repairFunnel.stages.map((st) => ({
    value: st.share,
    label: st.label,
    sub: st.fix,
    llm: st.llm,
    display: `${st.share}%`,
    tip: `${st.label}: ${st.share}% of streaming generations. ${st.fix}`,
  }));

  const colW = W / stages.length;
  const baseY = H - 8;
  const h = (v: number) => Math.max((v / 100) * (H - 40), 2);
  const y = (v: number) => baseY - h(v);
  const fills = [
    "color-mix(in srgb, var(--c1) 88%, var(--surface))",
    "color-mix(in srgb, var(--c1) 52%, var(--surface))",
    "color-mix(in srgb, var(--c1) 26%, var(--surface))",
  ];

  return (
    <Chart
      title="Repair funnel"
      sub="What happens to a broken generation before it can reach a user."
    >
      <div ref={holder} className={s.funnelWrap}>
        <svg
          className={s.svg}
          width={W}
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={`About ${production.triggerRate}% of streaming generations fail validation on the first pass; the sanitizer repairs ${production.repairedShare}% of those, leaving ${100 - production.repairedShare}% still broken`}
        >
          {stages.map((st, i) => {
            const x0 = i * colW;
            const x1 = (i + 1) * colW;
            const yTop = y(st.value);
            const next = stages[i + 1];
            const yNext = next ? y(next.value) : yTop;
            const t = next ? Math.min(TRANSITION, colW * 0.5) : 0;
            const path = next
              ? `M ${x0} ${baseY} L ${x0} ${yTop} L ${x1 - t} ${yTop} ` +
                `C ${x1 - t * 0.45} ${yTop} ${x1 - t * 0.55} ${yNext} ${x1} ${yNext} ` +
                `L ${x1} ${baseY} Z`
              : `M ${x0} ${baseY} L ${x0} ${yTop} L ${x1} ${yTop} L ${x1} ${baseY} Z`;
            return (
              <g key={st.label}>
                <path
                  className={s.fadeLate}
                  d={path}
                  fill={fills[i]}
                  style={{ "--d": `${i * 140}ms` } as React.CSSProperties}
                />
                {i > 0 ? (
                  <line x1={x0} x2={x0} y1={12} y2={baseY} stroke="var(--rule)" strokeWidth="1" />
                ) : null}
              </g>
            );
          })}
          <line x1={0} x2={W} y1={baseY} y2={baseY} stroke="var(--rule)" strokeWidth="1" />
        </svg>

        {/* percent pills. The last two bands are only a few pixels tall, so a
            pill centred on the band would sit half outside it and unreadable —
            they ride just above the band instead, on the clear card. */}
        {stages.map((st, i) => {
          const band = h(st.value);
          const cy = band > 48 ? baseY - band / 2 : Math.max(14, baseY - band - 18);
          return (
            <span
              key={st.label}
              className={`${s.funnelPill} ${s.fadeLate}`}
              style={
                {
                  left: `${((i + 0.5) / stages.length) * 100}%`,
                  top: cy,
                  "--d": `${200 + i * 140}ms`,
                } as React.CSSProperties
              }
            >
              {st.display}
            </span>
          );
        })}
      </div>

      <div className={s.funnelFeet}>
        {stages.map((st, i) => (
          <div key={st.label} className={`${s.funnelFoot} ${s.tip}`} data-tip={st.tip}>
            <span className={s.funnelFootHead}>
              <strong>{st.display}</strong>
              <span className={s.funnelFootLabel}>{st.label}</span>
              <span className={st.llm ? s.funnelBadgeLlm : s.funnelBadge}>
                {st.llm ? "One model call" : "No model call"}
              </span>
            </span>
            <span className={s.funnelFootSub}>{st.sub}</span>
          </div>
        ))}
      </div>
      <ChartDataDisclosure label="View repair data">
        <DataTable>
          <caption>Production repair funnel as a share of all streaming generations</caption>
          <thead>
            <tr>
              <th scope="col">Stage</th>
              <th scope="col" data-numeric="true">
                Share of generations
              </th>
              <th scope="col">What happens</th>
              <th scope="col">Model call</th>
            </tr>
          </thead>
          <tbody>
            {stages.map((stage) => (
              <tr key={`data-${stage.label}`}>
                <th scope="row">{stage.label}</th>
                <td data-numeric="true">{stage.value}%</td>
                <td>{stage.sub}</td>
                <td>{stage.llm ? "One model call" : "No model call"}</td>
              </tr>
            ))}
          </tbody>
        </DataTable>
        <p className={s.dataNote}>Production traffic, not benchmark runs.</p>
      </ChartDataDisclosure>
    </Chart>
  );
}

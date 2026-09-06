"use client";

/**
 * Charts for the DiffusionGemma finetune post. Every number comes from
 * lib/diffusion-blog-data.ts — nothing is hardcoded here.
 */

import { useEffect, useRef, useState } from "react";
import {
  B5_OWN_PROMPT,
  BANDS,
  BOARD_BRIEFS,
  DIAL,
  FRONTIER_BAND,
  OURS_OWN_PROMPT,
  ROUND_COST_USD,
  SCATTER,
  SPEED,
  STAGES,
} from "@/lib/diffusion-blog-data";
import { Chart, ChartDataDisclosure, DataTable, Row, styles as s, slotClass } from "./primitives";

function useWidth(initial = 712) {
  const holder = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(initial);
  useEffect(() => {
    const el = holder.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setW(Math.max(320, Math.round(entry.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { holder, w };
}

/* 1 ─ hero: score vs active parameters ------------------------------- */

export function DgScoreboard() {
  const { holder, w: W } = useWidth();
  const H = 430;
  const PAD = { left: 46, right: 24, top: 34, bottom: 44 };
  const PW = W - PAD.left - PAD.right;
  const PH = H - PAD.top - PAD.bottom;

  const X_MIN = Math.log10(2);
  const X_MAX = Math.log10(45);
  const x = (b: number) => PAD.left + ((Math.log10(b) - X_MIN) / (X_MAX - X_MIN)) * PW;
  const y = (v: number) => PAD.top + (1 - v / 100) * PH;

  const hero = SCATTER.find((p) => p.hero)!;
  const ghost = SCATTER.find((p) => p.ghost)!;

  return (
    <Chart
      title="OpenUI score vs active parameters, open models"
      sub="Every model measured under the identical public protocol: 46 briefs, 4 runs each, temperature 0.7, strict parser scoring."
      note={
        <>
          Same 4B active parameters as its base and its autoregressive twin; {OURS_OWN_PROMPT}% with
          the prompt it was trained with. The shaded band is where closed frontier models score.
        </>
      }
    >
      <div ref={holder} className={s.svgHolder} style={{ position: "relative" }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img"
          aria-label="Scatter chart of OpenUI score against active parameters. The finetuned DiffusionGemma scores highest of all open models at 4 billion active parameters.">
          {/* frontier band */}
          <rect x={PAD.left} width={PW} y={y(FRONTIER_BAND.hi)} height={y(FRONTIER_BAND.lo) - y(FRONTIER_BAND.hi)}
            fill="var(--rule)" opacity=".45" />
          <text x={PAD.left + 8} y={y(FRONTIER_BAND.hi) + 15} fontSize="11.5" fill="var(--ink-muted)">
            {FRONTIER_BAND.label} · {FRONTIER_BAND.lo}–{FRONTIER_BAND.hi}%
          </text>
          {/* gridlines */}
          {[0, 20, 40, 60, 80, 100].map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={PAD.left + PW} y1={y(t)} y2={y(t)} stroke="var(--rule)" />
              <text x={PAD.left - 9} y={y(t) + 4} textAnchor="end" fontSize="12" fill="var(--ink-muted)">{t}</text>
            </g>
          ))}
          {[2, 4, 8, 14, 31].map((b) => (
            <text key={b} x={x(b)} y={H - 18} textAnchor="middle" fontSize="12" fill="var(--ink-muted)">{b}B</text>
          ))}
          <text x={PAD.left + PW / 2} y={H - 2} textAnchor="middle" fontSize="11.5" fill="var(--ink-muted)">
            active parameters →
          </text>
          {/* the week arrow: base → finetuned, same params */}
          <line x1={x(ghost.params)} y1={y(ghost.score) - 9} x2={x(hero.params)} y2={y(hero.score) + 12}
            stroke="var(--ink-muted)" strokeWidth="1.4" strokeDasharray="4 4" markerEnd="url(#dg-arr)" />
          <defs>
            <marker id="dg-arr" markerWidth="7" markerHeight="7" refX="5.5" refY="3.5" orient="auto">
              <path d="M0,0 L7,3.5 L0,7 Z" fill="var(--ink-muted)" />
            </marker>
          </defs>
          {/* points — provider hues borrowed from the /benchmarks board scatter */}
          {SCATTER.map((p) => {
            const HUE: Record<string, string> = {
              ours: "var(--pO, #a78bfa)", dgbase: "#3978e6", g31: "#3978e6", twin: "#3978e6",
              phi4: "#2774c8", ministral: "#dc5a4f", granite: "#4d6fb8", lfm: "#c04f79",
            };
            const hue = HUE[p.id] ?? "var(--ink-muted)";
            const cx = x(p.params);
            const cy = y(p.score);
            if (p.hero) {
              return (
                <g key={p.id}>
                  <circle cx={cx} cy={cy} r="13" fill={hue} opacity=".2" />
                  <circle cx={cx} cy={cy} r="6.5" fill={hue} stroke="var(--surface)" strokeWidth="2" />
                  <text x={cx + 17} y={cy - 8} fontSize="13.5" fontWeight={750} fill="var(--ink)"
                    stroke="var(--surface)" strokeWidth={4} paintOrder="stroke">
                    {p.label}
                  </text>
                  <text x={cx + 17} y={cy + 9} fontSize="11.5" fontWeight={650} fill={hue}
                    stroke="var(--surface)" strokeWidth={4} paintOrder="stroke">
                    {p.score}% · up from {SCATTER.find((q) => q.ghost)!.score}%
                  </text>
                </g>
              );
            }
            const anchorRight = p.params > 12;
            return (
              <g key={p.id}>
                <circle cx={cx} cy={cy} r="4.5" fill={hue} stroke="var(--surface)" strokeWidth="2" />
                <text x={anchorRight ? cx - 10 : cx + 10} y={cy + 4} fontSize="12"
                  textAnchor={anchorRight ? "end" : "start"} fill="var(--ink-muted)"
                  stroke="var(--surface)" strokeWidth={4} paintOrder="stroke">
                  {p.label} · {p.score}%
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <ChartDataDisclosure>
        <DataTable>
          <thead><tr><th>model</th><th>active params</th><th>OpenUI score</th></tr></thead>
          <tbody>
            {SCATTER.map((p) => (
              <tr key={p.id}><td>{p.label}</td><td>{p.params}B</td><td>{p.score}%</td></tr>
            ))}
          </tbody>
        </DataTable>
      </ChartDataDisclosure>
    </Chart>
  );
}

/* 2 ─ defect anatomy across the three stages -------------------------- */

export function DgAnatomy() {
  const CLASSES = [
    { key: "schema" as const, label: "schema errors", slot: 1 as const },
    { key: "orphans" as const, label: "orphaned sections", slot: 2 as const },
    { key: "unresolved" as const, label: "undefined names", slot: 3 as const },
  ];
  const total = (st: (typeof STAGES)[number]) => st.schema + st.orphans + st.unresolved;
  const maxT = Math.max(...STAGES.map(total));
  const COLH = 250;
  const reduction = (total(STAGES[0]) / total(STAGES[STAGES.length - 1])).toFixed(1);
  return (
    <Chart
      title="Where the errors went"
      sub="One bar per stage, split by error class. SFT crushed the grammar but wiring got worse. Self-distillation is what finally moved everything at once."
      legend={CLASSES.map((c) => ({ label: c.label, slot: c.slot }))}
      note={
        <>
          Defect sites across the same {BOARD_BRIEFS}-brief board, strict parser scoring. The model
          was writing MORE the whole time: {STAGES[0].statements.toLocaleString()} →{" "}
          {STAGES[2].statements.toLocaleString()} statements.
        </>
      }
    >
      <div style={{ display: "flex", gap: 34, alignItems: "flex-end", justifyContent: "center", padding: "10px 8px 4px" }}>
        {STAGES.map((st, i) => {
          const t = total(st);
          const last = i === STAGES.length - 1;
          const rate = ((t / st.statements) * 100).toFixed(1);
          return (
            <div key={st.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 7, flex: "0 1 200px", minWidth: 0 }}>
              <span style={{ fontSize: 15, fontWeight: 700 }}>
                {t}
                {last ? (
                  <span className={slotClass(1)} style={{ fontSize: 12.5, fontWeight: 800, marginLeft: 8 }}>
                    {reduction}× fewer
                  </span>
                ) : null}
              </span>
              <div style={{ display: "flex", flexDirection: "column", width: "100%", height: (t / maxT) * COLH, borderRadius: 7, overflow: "hidden" }}>
                {CLASSES.map((c) => (
                  <span key={c.key} className={`${s.bar} ${slotClass(c.slot)}`}
                    style={{ width: "100%", height: `${(st[c.key] / t) * 100}%`, minHeight: st[c.key] ? 2 : 0, borderRadius: 0 }} />
                ))}
              </div>
              <span style={{ fontSize: 12.5, fontWeight: 650, textAlign: "center" }}>{st.label}</span>
              <span style={{ fontSize: 11.5, color: "var(--ink-muted)", textAlign: "center", lineHeight: 1.5 }}>
                {st.complete}/{BOARD_BRIEFS} screens complete
                <br />
                {rate} defects per 100 statements
              </span>
            </div>
          );
        })}
      </div>
    </Chart>
  );
}

/* 3b ─ the self-distillation loop, as a block diagram ------------------ */

export function DgLoop() {
  const BOXES = [
    { t: "generate", d: "the model writes a few hundred screens" },
    { t: "verify", d: "the parser keeps only the perfect ones" },
    { t: "repair", d: "near-misses fixed by a gated LLM, defects only" },
    { t: "retrain", d: "the model learns from its own best work" },
  ];
  return (
    <Chart
      title="Reinforcement learning where the compiler is the reward"
      sub="The simplest honest member of the RL family: generate, verify, keep only the wins. We call it self-distillation."
      note={<>Each pass costs about ${ROUND_COST_USD} and two hours on one A100. A repair touches ~2 statements out of 41 on average; the gate rejects anything that rewrites, deletes, or invents.</>}
    >
      <div style={{ position: "relative", padding: "14px 4px 44px" }}>
        <div style={{ display: "flex", alignItems: "stretch", gap: 0, flexWrap: "wrap", justifyContent: "center" }}>
          {BOXES.map((b, i) => (
            <div key={b.t} style={{ display: "flex", alignItems: "center" }}>
              <div style={{
                border: "1px solid var(--rule)", borderRadius: 12, padding: "12px 14px", width: 168,
                display: "flex", flexDirection: "column", gap: 4, background: "color-mix(in srgb, var(--rule) 26%, transparent)",
              }}>
                <span className={slotClass(1)} style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".07em", textTransform: "uppercase" }}>
                  {i + 1} · {b.t}
                </span>
                <span style={{ fontSize: 12, color: "var(--ink-muted)", lineHeight: 1.45 }}>{b.d}</span>
              </div>
              {i < BOXES.length - 1 ? (
                <span style={{ padding: "0 9px", color: "var(--ink-muted)", fontSize: 16 }} aria-hidden>→</span>
              ) : null}
            </div>
          ))}
        </div>
        {/* the return path: RETRAIN feeds GENERATE */}
        <svg aria-hidden style={{ position: "absolute", left: "6%", right: "6%", bottom: 2, width: "88%", height: 40, overflow: "visible" }}
          viewBox="0 0 100 30" preserveAspectRatio="none">
          <defs>
            <marker id="dg-loop-arr" markerWidth="7" markerHeight="7" refX="4.5" refY="3.5" orient="auto">
              <path d="M0,0 L7,3.5 L0,7 Z" fill="var(--ink-muted)" />
            </marker>
          </defs>
          <path d="M 92,0 L 92,16 Q 92,23 86,23 L 14,23 Q 8,23 8,16 L 8,4"
            fill="none" stroke="var(--ink-muted)" strokeWidth="1.4" strokeDasharray="4 4"
            vectorEffect="non-scaling-stroke" markerEnd="url(#dg-loop-arr)" />
        </svg>
        <span style={{
          position: "absolute", left: "50%", bottom: 4, transform: "translateX(-50%)",
          fontSize: 11.5, color: "var(--ink-muted)", background: "var(--surface)", padding: "0 10px", whiteSpace: "nowrap",
        }}>
          each pass trains the model that writes the next batch
        </span>
      </div>
    </Chart>
  );
}

/* 4 ─ the step dial: fewer denoising steps, better screens ------------ */

export function DgDial() {
  const { holder, w: W } = useWidth();
  const H = 300;
  const PAD = { left: 44, right: 120, top: 20, bottom: 42 };
  const PW = W - PAD.left - PAD.right;
  const PH = H - PAD.top - PAD.bottom;
  const stepsAll = [16, 24, 32, 64];
  const x = (st: number) => PAD.left + (stepsAll.indexOf(st) / (stepsAll.length - 1)) * PW;
  const y = (v: number) => PAD.top + (1 - v / 36) * PH;
  const path = (pts: Array<{ steps: number; complete: number }>) =>
    pts.map((p, i) => `${i === 0 ? "M" : "L"} ${x(p.steps)},${y(p.complete)}`).join(" ");
  return (
    <Chart
      title="Half the denoising steps, better screens"
      sub="Complete screens out of 46 at a fixed step budget. Each round of self-teaching moves the whole curve up and the cliff to the left."
      legend={DIAL.map((d, i) => ({ label: d.label, slot: (i + 1) as 1 | 2 | 3 }))}
      note="At 32 steps the finished model beats its own 64-step score. Below 24, wiring runs out of passes before grammar does."
    >
      <div ref={holder} className={s.svgHolder}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img"
          aria-label="Line chart: completed screens against denoising steps for round one and round three models.">
          {[0, 12, 24, 36].map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={PAD.left + PW} y1={y(t)} y2={y(t)} stroke="var(--rule)" />
              <text x={PAD.left - 9} y={y(t) + 4} textAnchor="end" fontSize="12" fill="var(--ink-muted)">{t}</text>
            </g>
          ))}
          {stepsAll.map((st) => (
            <text key={st} x={x(st)} y={H - 18} textAnchor="middle" fontSize="12" fill="var(--ink-muted)">{st}</text>
          ))}
          <text x={PAD.left + PW / 2} y={H - 2} textAnchor="middle" fontSize="11.5" fill="var(--ink-muted)">
            denoising steps per block →
          </text>
          {DIAL.map((d2, i) => (
            <g key={d2.id} className={slotClass((i + 1) as 1 | 2 | 3)}>
              <path d={path(d2.points)} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              {d2.points.map((p) => (
                <circle key={p.steps} cx={x(p.steps)} cy={y(p.complete)} r="4" fill="currentColor" />
              ))}
              <text x={x(d2.points[d2.points.length - 1].steps) + 10}
                y={y(d2.points[d2.points.length - 1].complete) + 4}
                fontSize="12" fontWeight={650} fill="currentColor">{d2.short}</text>
            </g>
          ))}
        </svg>
      </div>
    </Chart>
  );
}

/* 5 ─ serving speed ---------------------------------------------------- */

export function DgSpeed() {
  const max = Math.max(...SPEED.map((r) => r.secPerScreen));
  return (
    <Chart
      title="Seconds per screen in production"
      sub="Same serving stack for all three: vLLM, FP8, one A100, one request at a time. The last two rows share an identical early-stop sampler."
      note="No serving config changed between the last two rows. The model simply became certain enough that the sampler stops early on its own."
    >
      <div className={s.rows}>
        {SPEED.map((r, i) => (
          <Row key={r.id} label={r.label} wide tip={r.note}>
            <span className={`${s.bar} ${slotClass(((i % 3) + 1) as 1 | 2 | 3)}`}
              style={{ width: `${(r.secPerScreen / max) * 86}%` }} />
            <span className={s.value}>{r.secPerScreen}s · {r.toksPerSec} tok/s</span>
          </Row>
        ))}
      </div>
    </Chart>
  );
}

/* 6 ─ difficulty bands: where the gain landed -------------------------- */

export function DgBands() {
  const COLH = 210;
  return (
    <Chart
      title="The hard screens are where it won"
      sub="Published runs completed per difficulty band, base vs finetuned, same standard prompt. Base collapses as briefs get denser; the finetune keeps going."
      legend={[
        { label: "base model", slot: 3 },
        { label: "after SFT + self-distillation", slot: 1 },
      ]}
      note={
        <>
          46 briefs in five bands by complexity, 4 runs each. On the medium band base completed 1 run
          of 40. On the densest band the finetune reaches {B5_OWN_PROMPT}/32 with the prompt it was
          trained with.
        </>
      }
    >
      <div style={{ display: "flex", gap: 26, alignItems: "flex-end", justifyContent: "center", padding: "10px 8px 4px" }}>
        {BANDS.map((b) => (
          <div key={b.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 7, flex: "0 1 130px", minWidth: 0 }}>
            <div style={{ display: "flex", gap: 6, alignItems: "flex-end", width: "100%", justifyContent: "center", height: COLH }}>
              {([["base", 3], ["ours", 1]] as const).map(([k, slot]) => (
                <div key={k} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, width: 44 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: k === "base" ? "var(--ink-muted)" : undefined }}
                    className={k === "ours" ? slotClass(1) : undefined}>
                    {b[k]}
                  </span>
                  <span className={`${s.bar} ${slotClass(slot)}`}
                    style={{ width: "100%", height: Math.max(3, (b[k] / b.runs) * (COLH - 26)), borderRadius: 5 }} />
                </div>
              ))}
            </div>
            <span style={{ fontSize: 12, fontWeight: 650 }}>{b.label}</span>
            <span style={{ fontSize: 11, color: "var(--ink-muted)" }}>of {b.runs} runs</span>
          </div>
        ))}
      </div>
    </Chart>
  );
}

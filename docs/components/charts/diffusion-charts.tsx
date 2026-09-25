"use client";

// Charts for the OUI-1 post. Numbers live in lib/diffusion-blog-data.ts.

import { useEffect, useRef, useState } from "react";
import { BOARD_RUNS, CROSS_LIBRARY, FRONTIER_BAND, SCATTER, SPEED_ARC, STAGES } from "@/lib/diffusion-blog-data";
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

export function DgScoreboard() {
  const { holder, w: W } = useWidth();
  const H = 430;
  const PAD = { left: 46, right: 40, top: 34, bottom: 44 };
  const PW = W - PAD.left - PAD.right;
  const PH = H - PAD.top - PAD.bottom;

  const X_MIN = Math.log10(2);
  const X_MAX = Math.log10(45);
  const x = (b: number) => PAD.left + (1 - (Math.log10(b) - X_MIN) / (X_MAX - X_MIN)) * PW;
  const y = (v: number) => PAD.top + (1 - v / 100) * PH;

  const hero = SCATTER.find((p) => p.hero)!;
  const ghost = SCATTER.find((p) => p.ghost)!;

  return (
    <Chart
      title="Generative UI Benchmark, open-weight models up to 31B active"
    >
      <div ref={holder} className={s.svgHolder} style={{ position: "relative" }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img"
          aria-label="Scatter chart of Generative UI Benchmark score against active parameters for open-weight models up to 31B active. OUI-1 scores 71.7% at 4 billion active parameters; one 27B Qwen model scores higher.">
          <rect x={PAD.left} width={PW} y={y(FRONTIER_BAND.hi)} height={y(FRONTIER_BAND.lo) - y(FRONTIER_BAND.hi)}
            fill="var(--rule)" opacity=".45" />
          <text x={PAD.left + 8} y={y(FRONTIER_BAND.hi) + 15} fontSize="11.5" fill="var(--ink-muted)">
            {FRONTIER_BAND.label} · {FRONTIER_BAND.lo} to {FRONTIER_BAND.hi}%
          </text>
          {[0, 20, 40, 60, 80, 100].map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={PAD.left + PW} y1={y(t)} y2={y(t)} stroke="var(--rule)" />
              <text x={PAD.left - 9} y={y(t) + 4} textAnchor="end" fontSize="12" fill="var(--ink-muted)">{t}</text>
            </g>
          ))}
          {[31, 14, 8, 4, 2].map((b) => (
            <text key={b} x={x(b)} y={H - 18} textAnchor="middle" fontSize="12" fill="var(--ink-muted)">{b}B</text>
          ))}
          <text x={PAD.left + PW / 2} y={H - 2} textAnchor="middle" fontSize="11.5" fill="var(--ink-muted)">
            fewer active parameters →
          </text>
          <line x1={x(ghost.params)} y1={y(ghost.score) - 9} x2={x(hero.params)} y2={y(hero.score) + 12}
            stroke="var(--ink-muted)" strokeWidth="1.4" strokeDasharray="4 4" markerEnd="url(#dg-arr)" />
          <defs>
            <marker id="dg-arr" markerWidth="7" markerHeight="7" refX="5.5" refY="3.5" orient="auto">
              <path d="M0,0 L7,3.5 L0,7 Z" fill="var(--ink-muted)" />
            </marker>
          </defs>
          {SCATTER.map((p) => {
            const HUE: Record<string, string> = {
              ours: "var(--pO, #a78bfa)", dgbase: "#3978e6", g31: "#3978e6", twin: "#3978e6",
              phi4: "#2774c8", ministral: "#dc5a4f", granite: "#4d6fb8", lfm: "#c04f79",
              "qwen38-27b": "#7c4dff", "qwen36-27b": "#7c4dff", "qwen36-a3b": "#7c4dff",
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
                    OUI-1
                  </text>
                  <text x={cx + 17} y={cy + 9} fontSize="11.5" fontWeight={650} fill={hue}
                    stroke="var(--surface)" strokeWidth={4} paintOrder="stroke">
                    {p.score}% · {(p.score / SCATTER.find((q) => q.ghost)!.score).toFixed(1)}x the base model
                  </text>
                </g>
              );
            }
            const anchorRight = p.params === 8 || p.id === "lfm" || p.id === "qwen36-a3b";
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

export function DgAnatomy() {
  // wiring = undefined names + orphaned sections (see lib/diffusion-blog-data.ts)
  const CLASSES = [
    { key: "schema" as const, label: "schema errors", slot: 1 as const },
    { key: "wiring" as const, label: "wiring errors: undefined names and orphaned sections", slot: 3 as const },
  ];
  const val = (st: (typeof STAGES)[number], k: "schema" | "wiring") => (k === "schema" ? st.schema : st.orphans + st.unresolved);
  const total = (st: (typeof STAGES)[number]) => st.schema + st.orphans + st.unresolved;
  const maxT = Math.max(...STAGES.map(total));
  const COLH = 250;
  const reduction = (total(STAGES[0]) / total(STAGES[STAGES.length - 1])).toFixed(1);
  return (
    <Chart
      title="Where the errors went"
      legend={CLASSES.map((c) => ({ label: c.label, slot: c.slot }))}
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
                    style={{ width: "100%", height: `${(val(st, c.key) / t) * 100}%`, minHeight: val(st, c.key) ? 2 : 0, borderRadius: 0 }} />
                ))}
              </div>
              <span style={{ fontSize: 12.5, fontWeight: 650, textAlign: "center" }}>{st.label}</span>
              <span style={{ fontSize: 11.5, color: "var(--ink-muted)", textAlign: "center", lineHeight: 1.5 }}>
                {st.complete}/{BOARD_RUNS} runs complete
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

export function DgLoop() {
  const BOXES = [
    { t: "generate", d: "the model writes a few hundred openui-lang programs" },
    { t: "verify", d: "the parser keeps the ones that pass clean; a judge checks each against its brief" },
    { t: "repair", d: "near-misses fixed by an LLM, listed defects only, rewrites rejected" },
    { t: "retrain", d: "the survivors become the next training set" },
  ];
  return (
    <Chart
      title="Self-distillation: generate, verify, retrain"

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

export function DgSpeedArc() {
  const max = Math.max(...SPEED_ARC.map((r) => r.secPerScreen));
  return (
    <Chart
      title="Seconds per output, before and after supervised finetuning"
      sub="Same 20 light briefs, one request at a time, same serving settings for both rows: vLLM, FP8, one A100."
      note="The finetuned model writes longer outputs and needs about twice the denoising steps per token: it is committing real names and values where DiffusionGemma commits short, generic ones."
    >
      <div className={s.rows}>
        {SPEED_ARC.map((r, i) => (
          <Row key={r.id} label={r.label} wide tip={r.note}>
            <span className={`${s.bar} ${slotClass(i === 0 ? 2 : 3)}`}
              style={{ width: `${(r.secPerScreen / max) * 72}%` }} />
            <span className={s.value}>{r.secPerScreen}s</span>
          </Row>
        ))}
      </div>
    </Chart>
  );
}

export function DgCrossLibrary() {
  const rows = [
    { id: "base", label: "DiffusionGemma", n: CROSS_LIBRARY.base, slot: 3 as const },
    { id: "ours", label: "OUI-1", n: CROSS_LIBRARY.ours, slot: 1 as const },
  ];
  return (
    <Chart
      title="Valid outputs on the appless phone library"
      sub={`${CROSS_LIBRARY.asks} asks written independently of every training file, one output each, counted valid when it parses clean: no schema errors, every name defined, at least three statements.`}
      note="A different component library from the benchmark's, with its own signatures in the system prompt. None of these asks or outputs were trained on."
    >
      <div className={s.rows}>
        {rows.map((r) => (
          <Row key={r.id} label={r.label} wide>
            <span className={`${s.bar} ${slotClass(r.slot)}`} style={{ width: `${(r.n / CROSS_LIBRARY.asks) * 78}%` }} />
            <span className={s.value}>{r.n} / {CROSS_LIBRARY.asks}</span>
          </Row>
        ))}
      </div>
    </Chart>
  );
}

export function DgErrorExample() {
  const LINES: Array<{ code: string; note?: string; kind?: "grammar" | "wiring" }> = [
    { code: 'header = CardHeader("Spending", "last 7 days")' },
    { code: 'total  = Heading("$24,180", "h9")', note: "schema: h9 is not a heading level", kind: "grammar" },
    { code: 'chart  = AreaChart(days, [spend], "wavy")', note: 'schema: "wavy" is not a curve type', kind: "grammar" },
    { code: 'footer = TextContent("Updated today")', note: "wiring: defined, never attached to root", kind: "wiring" },
    { code: "root   = Card([header, total, chart, summary])", note: "wiring: summary is never defined", kind: "wiring" },
  ];
  const COLOR = { grammar: "#e5484d", wiring: "#d97706" } as const;
  return (
    <div style={{ border: "1px solid var(--rule)", borderRadius: 12, padding: "14px 0", margin: "1.25rem 0", overflowX: "auto", background: "color-mix(in srgb, var(--rule) 18%, transparent)", fontFamily: "var(--font-geist-mono, ui-monospace, SFMono-Regular, Menlo, monospace)", fontSize: 13, lineHeight: 1.9 }}>
      {LINES.map((l) => (
        <div key={l.code} style={{ display: "flex", gap: 24, padding: "0 18px", whiteSpace: "pre", background: l.kind ? `color-mix(in srgb, ${COLOR[l.kind]} 9%, transparent)` : undefined, boxShadow: l.kind ? `inset 3px 0 0 ${COLOR[l.kind]}` : undefined }}>
          <span style={{ flex: "0 0 auto", minWidth: 380, color: "var(--ink)" }}>{l.code}</span>
          {l.note ? <span style={{ color: COLOR[l.kind!], fontWeight: 600 }}>{"// " + l.note}</span> : null}
        </div>
      ))}
    </div>
  );
}

import { Renderer } from "@openuidev/react-lang";
import type { Meta } from "@storybook/react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { openuiLibrary } from "../../../genui-lib";

// ── Sample program ────────────────────────────────────────────────────────────
//
// 7 statements stream in one by one. Because of structural sharing in the
// parser, already-resolved nodes keep the same ElementNode reference —
// React.memo on RenderNode uses === comparison to skip re-renders.
//
// Open React DevTools → Components → enable "Highlight updates when
// components render" to see which nodes flash green on each chunk.

const FULL_PROGRAM = `root = Stack([header, kpis, sep, details, alert])
header = CardHeader("Sales Dashboard", "Q4 2024")
kpis = Stack([rev_card, orders_card, margin_card], "row")
rev_card = Card([rev_label, rev_value])
rev_label = TextContent("Revenue", "small")
rev_value = TextContent("$2.4M", "large-heavy")
orders_card = Card([orders_label, orders_value])
orders_label = TextContent("Orders", "small")
orders_value = TextContent("1,847", "large-heavy")
margin_card = Card([margin_label, margin_value])
margin_label = TextContent("Margin", "small")
margin_value = TextContent("38%", "large-heavy")
sep = Separator()
details = Stack([trend, region, updated])
trend = TextContent("Revenue up 12% vs Q3 2024")
region = TextContent("Top region: North America")
updated = TextContent("Updated just now", "small")
alert = Callout("info", "Q5 Preview", "Early data shows 8% growth forecast")
`;

// Characters-per-second presets (delay between each char in ms)
const SPEED_DELAY: Record<string, number> = {
  "0.5×": 60,
  "1×": 30,
  "2×": 15,
  "4×": 7,
};
const SPEED_OPTIONS = Object.keys(SPEED_DELAY);

// ── Helpers ───────────────────────────────────────────────────────────────────

function splitLines(text: string) {
  const parts = text.split("\n");
  const completeLines = parts.slice(0, -1);
  const partial = parts[parts.length - 1];
  return { completeLines, partial };
}

function pct(pos: number) {
  return Math.round((pos / FULL_PROGRAM.length) * 100);
}

// ── Code panel styles ─────────────────────────────────────────────────────────

const S = {
  root: {
    display: "flex",
    height: "100vh",
    fontFamily: "'DM Sans', 'Inter', sans-serif",
    background: "#0f172a",
    color: "#e2e8f0",
  } as React.CSSProperties,

  left: {
    width: "38%",
    minWidth: 320,
    display: "flex",
    flexDirection: "column" as const,
    borderRight: "1px solid #1e293b",
    overflow: "hidden",
  },

  toolbar: {
    padding: "12px 16px",
    borderBottom: "1px solid #1e293b",
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
    background: "#0a1120",
  },

  btn: {
    padding: "5px 12px",
    borderRadius: 6,
    border: "1px solid #334155",
    background: "#1e293b",
    color: "#e2e8f0",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 4,
    letterSpacing: "0.02em",
  } as React.CSSProperties,

  btnPrimary: {
    background: "#3b82f6",
    borderColor: "#3b82f6",
    color: "#fff",
  } as React.CSSProperties,

  speedSelect: {
    padding: "4px 8px",
    borderRadius: 6,
    border: "1px solid #334155",
    background: "#1e293b",
    color: "#e2e8f0",
    fontSize: 12,
    cursor: "pointer",
  } as React.CSSProperties,

  label: {
    fontSize: 11,
    color: "#64748b",
    letterSpacing: "0.05em",
    textTransform: "uppercase" as const,
  },

  codeArea: {
    flex: 1,
    overflow: "auto",
    padding: "16px",
  },

  pre: {
    margin: 0,
    fontFamily: "'Geist Mono', 'Space Mono', monospace",
    fontSize: 12,
    lineHeight: 1.7,
    whiteSpace: "pre-wrap" as const,
    wordBreak: "break-all" as const,
  },

  progressBar: {
    height: 2,
    background: "#1e293b",
    flexShrink: 0,
  },

  progressFill: (pct: number): React.CSSProperties => ({
    height: "100%",
    width: `${pct}%`,
    background: "linear-gradient(90deg, #3b82f6, #8b5cf6)",
    transition: "width 0.1s linear",
  }),

  statsBar: {
    padding: "10px 16px",
    borderTop: "1px solid #1e293b",
    flexShrink: 0,
    background: "#0a1120",
    display: "flex",
    alignItems: "center",
    gap: 16,
    fontSize: 11,
    color: "#64748b",
  },

  badge: (ok: boolean): React.CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    padding: "2px 6px",
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 700,
    background: ok ? "#14532d" : "#431407",
    color: ok ? "#4ade80" : "#fb923c",
    letterSpacing: "0.04em",
  }),

  right: {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    overflow: "hidden",
    background: "#f8fafc",
  },

  rightHeader: {
    padding: "12px 20px",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
    background: "#fff",
  },

  rendererWrap: {
    flex: 1,
    overflow: "auto",
    padding: 24,
  },

  hint: {
    marginTop: 12,
    padding: "10px 14px",
    borderRadius: 8,
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    fontSize: 11,
    color: "#1d4ed8",
    lineHeight: 1.5,
  },
} as const;

// ── Main story component ──────────────────────────────────────────────────────

function StreamingReplayDemo() {
  const [accumulated, setAccumulated] = useState("");
  const [charCount, setCharCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState("1×");
  const [parseResult, setParseResult] = useState<{
    meta: { statementCount: number; unresolved: string[] };
  } | null>(null);
  const posRef = useRef(0);

  const done = charCount >= FULL_PROGRAM.length;

  // Core playback effect — restarts whenever isPlaying or speed changes
  useEffect(() => {
    if (!isPlaying) return;

    const delay = SPEED_DELAY[speed];
    const id = setInterval(() => {
      posRef.current = Math.min(posRef.current + 1, FULL_PROGRAM.length);
      const next = FULL_PROGRAM.slice(0, posRef.current);
      setAccumulated(next);
      setCharCount(posRef.current);
      if (posRef.current >= FULL_PROGRAM.length) {
        setIsPlaying(false);
      }
    }, delay);

    return () => clearInterval(id);
  }, [isPlaying, speed]);

  const handlePlayPause = useCallback(() => {
    if (done) return;
    setIsPlaying((p) => !p);
  }, [done]);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    posRef.current = 0;
    setAccumulated("");
    setCharCount(0);
    setParseResult(null);
  }, []);

  // ── Code display ─────────────────────────────────────────────────────────────

  const { completeLines, partial } = splitLines(accumulated);
  const progress = pct(charCount);

  const unresolvedCount = parseResult?.meta.unresolved.length ?? 0;
  const stmtCount = parseResult?.meta.statementCount ?? 0;
  const totalStmts = FULL_PROGRAM.trim().split("\n").length;

  return (
    <div style={S.root}>
      {/* ── Left: code panel ── */}
      <div style={S.left}>
        {/* Toolbar */}
        <div style={S.toolbar}>
          <button
            style={{ ...S.btn, ...(isPlaying || done ? {} : S.btnPrimary) }}
            onClick={handlePlayPause}
            disabled={done}
          >
            {isPlaying ? "⏸ Pause" : done ? "✓ Done" : "▶ Play"}
          </button>
          <button style={S.btn} onClick={handleReset}>
            ↺ Reset
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: "auto" }}>
            <span style={S.label}>Speed</span>
            <select
              style={S.speedSelect}
              value={speed}
              onChange={(e) => setSpeed(e.target.value)}
            >
              {SPEED_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Progress bar */}
        <div style={S.progressBar}>
          <div style={S.progressFill(progress)} />
        </div>

        {/* Code */}
        <div style={S.codeArea}>
          {accumulated === "" ? (
            <div
              style={{
                color: "#334155",
                fontFamily: "'Geist Mono', monospace",
                fontSize: 12,
                lineHeight: 1.7,
                padding: "4px 0",
              }}
            >
              {/* Ghost preview of first line */}
              {FULL_PROGRAM.split("\n")[0]}
              <span style={{ opacity: 0.3 }}> ← press Play to start streaming</span>
            </div>
          ) : (
            <pre style={S.pre}>
              {/* Completed statements — white */}
              {completeLines.map((line, i) => (
                <div key={i} style={{ color: "#e2e8f0" }}>
                  {line}
                </div>
              ))}
              {/* In-progress line — amber, shows partial token */}
              {partial && (
                <div style={{ color: "#fbbf24" }}>
                  {partial}
                  {isPlaying && (
                    <span
                      style={{
                        display: "inline-block",
                        width: 7,
                        height: 13,
                        background: "#fbbf24",
                        marginLeft: 1,
                        verticalAlign: "middle",
                        animation: "openui-blink 0.9s step-start infinite",
                      }}
                    />
                  )}
                </div>
              )}
            </pre>
          )}
          <style>{`
            @keyframes openui-blink {
              0%, 100% { opacity: 1; }
              50% { opacity: 0; }
            }
          `}</style>
        </div>

        {/* Stats bar */}
        <div style={S.statsBar}>
          <span>
            <strong style={{ color: "#94a3b8" }}>{stmtCount}</strong>
            <span> / {totalStmts} stmts</span>
          </span>
          <span>
            <strong style={{ color: "#94a3b8" }}>{progress}%</strong>
          </span>
          {unresolvedCount > 0 && (
            <span style={S.badge(false)}>⚠ {unresolvedCount} unresolved</span>
          )}
          {done && stmtCount > 0 && unresolvedCount === 0 && (
            <span style={S.badge(true)}>✓ complete</span>
          )}
        </div>
      </div>

      {/* ── Right: renderer ── */}
      <div style={S.right}>
        <div style={S.rightHeader}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Rendered Output
          </span>
          <span
            style={{
              marginLeft: "auto",
              fontSize: 11,
              color: "#94a3b8",
              background: "#f1f5f9",
              padding: "2px 8px",
              borderRadius: 4,
            }}
          >
            Open React DevTools → ⚛ Components → ⚙ Highlight updates
          </span>
        </div>

        <div style={S.rendererWrap}>
          {accumulated ? (
            <>
              <Renderer
                response={accumulated}
                library={openuiLibrary}
                isStreaming={isPlaying}
                onParseResult={setParseResult}
              />
              {done && (
                <div style={S.hint}>
                  <strong>How to verify structural sharing:</strong> Press Reset then Play again.
                  Watch React DevTools — on each new statement, only the new component flashes
                  green. Previously rendered siblings use the same <code>ElementNode</code>{" "}
                  reference and are skipped by <code>React.memo</code>.
                </div>
              )}
            </>
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                color: "#cbd5e1",
                fontSize: 13,
                flexDirection: "column",
                gap: 8,
              }}
            >
              <span style={{ fontSize: 32 }}>▶</span>
              <span>Press Play to start streaming</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Story definition ──────────────────────────────────────────────────────────

const meta: Meta = {
  title: "Playground/StreamingReplay",
  tags: ["dev"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Streaming replay playground. Simulates LLM token streaming and lets you observe which React components re-render using React DevTools.",
      },
    },
  },
};

export default meta;

export const Default = {
  name: "Streaming Replay",
  render: () => <StreamingReplayDemo />,
};

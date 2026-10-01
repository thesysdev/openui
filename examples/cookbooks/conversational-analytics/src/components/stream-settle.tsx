"use client";

// Settled streaming: a block appears only once the model has finished writing it.
//
// OpenUI renders the answer on every chunk. The parser marks the whole tree `partial` while the
// stream runs, but no single node knows whether its own text is finished, so a Table grows column
// by column and a chart reloads as its arguments arrive. This wrapper works that out per node
// from the streamed source, using lang-core's own tokenizer and statement splitter:
//
// - A statement is finished once the stream has moved past it (a newline at bracket depth 0).
//   The last statement in the buffer is still being written.
// - A node belongs to its nearest statement: its own statementId, or its parent's.
// - A node is settled when that statement is finished and every statement it refers to is
//   defined and settled too, so a Card waits for the Table it names.
//
// Until then the node shows a checkerboard placeholder at its expected final size; once settled it shows
// the real component, with a short fade. When the stream ends, everything is settled.
import { MessageContext, useThread } from "@openuidev/react-headless";
import { parseExpression, split, tokenize, walkAST, type ASTNode } from "@openuidev/lang-core";
import { useIsStreaming, type ComponentRenderProps, type DefinedComponent } from "@openuidev/react-lang";
import { createContext, useContext, useLayoutEffect, useRef, useState, type FC } from "react";
import "./stream-settle.css";

/* ---------------------------------------------------------------- source analysis */

type Analysis = {
  /** Statements the stream has moved past, with the statements each one names. */
  done: Map<string, string[]>;
  /** The statement still being written, if any. */
  pending?: string;
};

// What the parser reads: the fenced program if there is one, without the chat's envelope lines.
function programText(raw: string) {
  const text = raw
    .split("\n")
    .filter((line) => !line.includes("]]>openui:"))
    .join("\n");
  if (!text.includes("```")) return text;
  const blocks: string[] = [];
  const re = /```[^\n]*\n([\s\S]*?)(?:```|$)/g;
  for (let m = re.exec(text); m; m = re.exec(text)) blocks.push(m[1]);
  // A closed fence means the program is finished, so end it with a newline.
  return blocks.join("\n") + (/```[^\n]*\n[\s\S]*```/.test(text) ? "\n" : "");
}

// Index just past the last newline at bracket depth 0, outside strings: everything before it is
// finished statements, everything after is the one still streaming.
function finishedEnd(src: string) {
  let depth = 0;
  let inStr: false | '"' | "'" = false;
  let esc = false;
  let end = 0;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (esc) esc = false;
    else if (inStr) {
      if (c === "\\") esc = true;
      else if (c === inStr) inStr = false;
    } else if (c === '"' || c === "'") inStr = c;
    else if (c === "(" || c === "[" || c === "{") depth++;
    else if (c === ")" || c === "]" || c === "}") depth = Math.max(0, depth - 1);
    else if (c === "\n" && depth === 0) end = i + 1;
  }
  return end;
}

function refsOf(tokens: Parameters<typeof parseExpression>[0]) {
  const names = new Set<string>();
  try {
    walkAST(parseExpression(tokens), (node: ASTNode) => {
      if (node.k === "Ref") names.add(node.n);
    });
  } catch {
    // An expression the parser can't read names nothing.
  }
  return [...names];
}

let last: { raw: string; analysis: Analysis } | null = null;

function analyse(raw: string): Analysis {
  if (last?.raw === raw) return last.analysis;
  const src = programText(raw);
  const end = finishedEnd(src);
  const done = new Map<string, string[]>();
  for (const stmt of split(tokenize(src.slice(0, end)))) done.set(stmt.id, refsOf(stmt.tokens));
  const pending = src.slice(end).match(/^\s*(\$?[A-Za-z_][\w]*)\s*=/)?.[1];
  const analysis = { done, pending };
  last = { raw, analysis };
  return analysis;
}

function isSettled(id: string, a: Analysis, seen = new Set<string>()): boolean {
  if (seen.has(id)) return true;
  seen.add(id);
  if (id === a.pending) return false;
  const refs = a.done.get(id);
  // Not in the source at all: a reference to a statement the model hasn't written yet.
  if (!refs) return false;
  return refs.every((r) => isSettled(r, a, seen));
}

/* ---------------------------------------------------------------- statement scope */

// The statement a node was written in. Inline components have no statementId of their own, so
// every component passes its statement down and the nearest one wins.
const StatementScope = createContext<string | undefined>(undefined);

type AnyComponent = DefinedComponent<any>;
type Renderer = FC<ComponentRenderProps<any>>;

function withScope(def: AnyComponent): AnyComponent {
  const Inner = def.component as Renderer;
  const Scoped: Renderer = (p) =>
    p.statementId ? (
      <StatementScope.Provider value={p.statementId}>
        <Inner {...p} />
      </StatementScope.Provider>
    ) : (
      <Inner {...p} />
    );
  Scoped.displayName = `Scoped(${def.name})`;
  return { ...def, component: Scoped };
}

/* ---------------------------------------------------------------- the gate */

/** Expected final height in px from the props streamed so far. */
export type Estimate = (props: Record<string, any>) => number;

/** The thread's latest answer, which is the one streaming. */
function useLatestAnswer() {
  return useThread((s) => {
    for (let i = s.messages.length - 1; i >= 0; i--) {
      const m = s.messages[i];
      if (m.role === "assistant") return typeof m.content === "string" ? m.content : "";
    }
    return "";
  });
}

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

function withSettle(def: AnyComponent, estimate: Estimate, chart: boolean): AnyComponent {
  const Inner = def.component as Renderer;
  const Settled: Renderer = (p) => {
    const streaming = useIsStreaming();
    // Mounted mid-stream means mounted inside a live chat. A finished answer or the gallery is
    // never gated, so it never reads the thread (and needs no ChatProvider).
    const [live] = useState(streaming);
    const scope = useContext(StatementScope);
    const message = useContext(MessageContext)?.message;
    // eslint-disable-next-line react-hooks/rules-of-hooks -- `live` never changes for a mounted node
    const latest = live ? useLatestAnswer() : "";
    const settled = useRef(!live);
    // Where the placeholder sat, so the real component can fade in at the same spot. No wrapper
    // element: charts colour themselves by :nth-child, and a wrapper would change the count.
    const spot = useRef<{ parent: Element; prev: Element | null } | null>(null);
    const revealed = useRef(false);

    if (!settled.current) {
      const raw = message?.role === "assistant" && typeof message.content === "string" ? message.content : latest;
      const id = p.statementId ?? scope;
      // Fail open: with the stream over, or no statement to go on, show the real thing.
      settled.current = !streaming || !id || isSettled(id, analyse(raw));
    }

    useLayoutEffect(() => {
      if (!settled.current || revealed.current || !spot.current) return;
      revealed.current = true;
      const { parent, prev } = spot.current;
      const el = prev ? prev.nextElementSibling : parent.firstElementChild;
      if (el && !prefersReducedMotion())
        el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: "ease-out" });
    });

    if (!settled.current) {
      const keep = (el: Element | null) => {
        if (el?.parentElement) spot.current = { parent: el.parentElement, prev: el.previousElementSibling };
      };
      const height = estimate(p.props ?? {});
      // A chart waits in its own loading panel, which draws the same board, so the hand-off to its
      // data load is seamless.
      return chart ? (
        <figure ref={keep} className="f1-chart f1-chart-pending" style={{ minHeight: height }} aria-busy="true">
          <div className="f1-settle f1-chart-board" aria-hidden />
        </figure>
      ) : (
        <div ref={keep} className="f1-settle" style={{ height }} aria-busy="true" />
      );
    }
    return <Inner {...p} />;
  };
  Settled.displayName = `Settled(${def.name})`;
  return withScope({ ...def, component: Settled });
}

/* ---------------------------------------------------------------- estimates */

type Node = { typeName?: string; props?: Record<string, any> } | null | undefined;
const list = (v: unknown): Node[] => (Array.isArray(v) ? (v as Node[]) : []);

// F1 Table: 37px header, 61px rows with an avatar or logo in the start slot (45px without). The row count
// is known once the first column's array has closed, which it has once a second column starts;
// until then, assume a top ten.
const tableHeight: Estimate = (props) => {
  const cols = list(props.columns);
  const start = list(props.start);
  const lengths = cols.slice(0, -1).map((c) => list(c?.props?.data).length);
  const rows = Math.max(lengths[0] ?? 0, start.length) || 10;
  // The start slot streams last, so go by the prompt's rule that driver and team tables have one.
  return 37 + rows * 61;
};

const TEXT_HEIGHT: Record<string, number> = { h1: 44, h2: 32, h3: 26, "small-heavy": 27, small: 27 };

function nodeHeight(node: Node): number {
  if (!node || typeof node !== "object") return 0;
  const props = node.props ?? {};
  switch (node.typeName) {
    case "Table":
      return tableHeight(props);
    case "TextContent":
      return TEXT_HEIGHT[props.size] ?? 24 * Math.max(1, Math.ceil(String(props.text ?? "").length / 90));
    case "CardHeader":
      return 56;
    case "Stack": {
      const kids = list(props.children).map(nodeHeight);
      if (!kids.length) return 0;
      return props.direction === "row" ? Math.max(...kids) : kids.reduce((a, b) => a + b, 0) + (kids.length - 1) * 12;
    }
    case "DriverAvatar":
      return props.size === "l" ? 96 : props.size === "m" ? 56 : 32;
    default:
      return 40;
  }
}

// OpenUI Card in the F1 theme: no padding, children 8px apart.
const cardHeight: Estimate = (props) => {
  const kids = list(props.children).map(nodeHeight);
  return kids.reduce((a, b) => a + b, 0) + Math.max(0, kids.length - 1) * 8;
};

const fixed = (h: number): Estimate => () => h;
const count = (v: unknown, fallback: number) => (Array.isArray(v) && v.length ? v.length : fallback);

/** Each gated component, with its expected height and whether it waits as a chart panel. */
const SETTLE: Record<string, { estimate: Estimate; chart?: boolean }> = {
  Table: { estimate: tableHeight },
  Card: { estimate: cardHeight },
  Spotlight: { estimate: fixed(191) },
  FollowUpBlock: { estimate: fixed(257) },
  GapChart: { estimate: fixed(380), chart: true },
  RaceTrace: { estimate: fixed(380), chart: true },
  LapTimes: { estimate: fixed(380), chart: true },
  ChampionshipProgress: { estimate: fixed(380), chart: true },
  HeadToHeadBars: { estimate: fixed(360), chart: true },
  RankedBars: { estimate: (p) => Math.min(typeof p.top === "number" ? p.top : 10, 10) * 36 + 80, chart: true },
  StintBar: { estimate: (p) => count(p.drivers, typeof p.top === "number" ? p.top : 10) * 30 + 90, chart: true },
  LineChart: { estimate: fixed(380), chart: true },
  BarChart: { estimate: fixed(380), chart: true },
};

/**
 * Wraps a library's components for settled streaming: the components in SETTLE wait until their
 * source is complete, and every component passes its statement down so inline children can tell.
 */
export function settleWhileStreaming(components: AnyComponent[]): AnyComponent[] {
  return components.map((def) => {
    const rule = SETTLE[def.name];
    return rule ? withSettle(def, rule.estimate, !!rule.chart) : withScope(def);
  });
}

/* ---------------------------------------------------------------- gallery preview */

/** The block-by-block placeholder at the sizes an answer uses, for the /component gallery. */
export function BlockLoadingPreview() {
  const tile = (label: string, height: number) => (
    <div style={{ display: "grid", gap: 6 }}>
      <span style={{ color: "#606066", fontSize: 13, fontWeight: 700 }}>{label}</span>
      <div className="f1-settle" style={{ height }} aria-hidden />
    </div>
  );
  return (
    <div style={{ display: "grid", gap: 20 }}>
      {tile("Card with a top-ten table (682px)", 682)}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
        {tile("Spotlight (191px)", 191)}
        {tile("Follow-ups (257px)", 257)}
      </div>
      <p className="ref-note">
        Shown in block-by-block streaming while a Table, Card, Spotlight or FollowUpBlock is still being written, at the
        block&apos;s expected final height. The sweep runs only while loading and stops with reduced motion. Chart loading panels
        draw the same board.
      </p>
    </div>
  );
}

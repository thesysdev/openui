"use client";

import {
  ArrowUp,
  CalendarDays,
  ChartPie,
  Check,
  type LucideIcon,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { type CSSProperties, useCallback, useState } from "react";
import { Dashboard, type LookId, LOOKS, type Mode, REVENUE_CARD, RevenueCard } from "./Dashboard";
import styles from "./Film.module.css";
import {
  blurIn,
  blurSwap,
  type Cam,
  camAt,
  type CamKey,
  clamp01,
  ease,
  lerp,
  ramp,
} from "./motion";
import { useDark, useNarrow } from "./useDark";

/* The How it works film. One subject at a time, in the centre of the frame:
   the question, the three pieces of data it needs and where each one comes
   from, the interpreter filling the one gap, then the dashboard assembling,
   its live line, a theme switch, and a one-chart edit. Every frame is a pure
   function of the film time T, so any step can be shown on demand. World
   units are px in a 1200x600 viewport. */

export const FILM_STEPS = [
  { id: "fetch", start: 0, length: 7.9 },
  { id: "transform", start: 7.9, length: 4.6 },
  { id: "refresh", start: 12.5, length: 5.5 },
  { id: "components", start: 18, length: 5.5 },
  { id: "edit", start: 23.5, length: 6 },
] as const;
export const FILM_LENGTH = 29.5;
/* Partway through the closing move the content resets, so the loop's last
   frame is its first. */
const RESET = 29.2;

/* World layout. */
const INPUT = { x: 600, y: 300, w: 720, h: 76, pad: 32 };
const QUERY_SIZE = 22;
const PROMPT_Y = 300;
const PROMPT_SCALE = 1.3;
/* The needs on the left and your database on the right carry the same
   weight; one straight rail joins each need to it. */
const LIST = { x: 170, y: 196, w: 260, h: 208, label: 228 };
const LABEL_SIZE = 16;
const FLY_SCALE = (QUERY_SIZE * PROMPT_SCALE) / LABEL_SIZE;
const DB = { x: 770, y: 196, w: 260, h: 208 };
const GAP = { w: 140, h: 30, openW: 268, openH: 172 };
const DASH = { x: 100, y: 750, w: 1000, h: 700 };
const REV = {
  x: DASH.x + REVENUE_CARD.x,
  y: DASH.y + REVENUE_CARD.y,
  w: REVENUE_CARD.w,
  h: REVENUE_CARD.h,
};
const BUILD_AT = 12.9;
const REFRESH_AT = 16.4;
/* Framings: the whole dashboard, a slight push for the refresh, and the
   theme switch with room for the tabs above and the same room below. */
const VIEW = { cx: 600, cy: DASH.y + DASH.h / 2, s: 0.78 };
const PUSH = { cx: 600, cy: DASH.y + 230, s: 1.15 };
const BRAND_S = 0.68;
const TABS_Y = (600 - (40 + 20 + DASH.h * BRAND_S)) / 2;
const BRAND = { cx: 600, cy: DASH.y + (300 - (TABS_Y + 60)) / BRAND_S, s: BRAND_S };

const X0 = LIST.x + LIST.w;
const X1 = DB.x;
const XM = (X0 + X1) / 2;

/* ---------- The question and the data it needs ---------- */

type Need = "month" | "subscribers" | "revenue";
type NeedSpec = {
  id: Need;
  label: string;
  icon: LucideIcon;
  /** Centre of the need's row and of its rail. */
  y: number;
  endpoint?: string;
  /** When the word lights up, leaves the sentence, and its rail draws. */
  lit: number;
  fly: number;
  draw: number;
};

const NEEDS: NeedSpec[] = [
  {
    id: "month",
    label: "This month",
    icon: CalendarDays,
    y: 236,
    endpoint: "GET /campaigns",
    lit: 2.6,
    fly: 3.3,
    draw: 4.5,
  },
  {
    id: "subscribers",
    label: "Subscribers",
    icon: Users,
    y: 300,
    endpoint: "GET /subscribers",
    lit: 2.72,
    fly: 3.38,
    draw: 5.5,
  },
  {
    id: "revenue",
    label: "Revenue by source",
    icon: ChartPie,
    y: 364,
    lit: 2.84,
    fly: 3.46,
    draw: 6.5,
  },
];
const AGE = NEEDS[2];

const WORDS: { text: string; need?: Need }[] = [
  { text: "Show" },
  { text: "this month\u2019s", need: "month" },
  { text: "subscribers", need: "subscribers" },
  { text: "and" },
  { text: "revenue by source", need: "revenue" },
];

const SEND_AT = 1.55;
const MORPH: [number, number] = [1.75, 2.45];
const FLY_LENGTH = 0.85;
/* The gap: its chip turns into the interpreter, opens as the camera moves in,
   streams the script, and closes again once it has run. */
const INTERP_AT = 7.9;
const OPEN: [number, number] = [8.2, 9.0];
const CODE_AT = 9.05;
const DONE_AT = 10.6;
const CLOSE: [number, number] = [11.0, 11.8];
const HEAL_AT = 11.55;
const GAP_Y = AGE.y;
const GAP_OPEN_Y = GAP_Y - GAP.h / 2 + GAP.openH / 2;

const CODE = [
  "rows = payments(month)",
  "for (const p of rows) {",
  "  s = sourceOf(p.product)",
  "  revenue[s] += p.amount",
  "}",
  "return revenue",
];

type Status = "loading" | "ok" | "miss";

function statusAt(n: NeedSpec, tc: number): Status | undefined {
  if (tc < n.draw) return undefined;
  if (n.endpoint) return tc >= n.draw + 0.85 ? "ok" : "loading";
  if (tc >= HEAL_AT + 0.35) return "ok";
  if (tc >= INTERP_AT) return "loading";
  return tc >= n.draw + 0.35 ? "miss" : "loading";
}

type Anchors = { width: number; height: number; left: Partial<Record<Need, number>> };

function Query({
  tc,
  anchors,
  onMeasure,
}: {
  tc: number;
  anchors: Anchors | null;
  onMeasure: (a: Anchors) => void;
}) {
  const m = ramp(tc, MORPH[0], MORPH[1]);
  const W = anchors?.width ?? 470;
  const H = anchors?.height ?? 30;
  const x = lerp(INPUT.x - INPUT.w / 2 + INPUT.pad + W / 2, 600, m);
  const y = lerp(INPUT.y, PROMPT_Y, m);
  const rest = ramp(tc, 3.3, 3.75);
  const press = ramp(tc, SEND_AT - 0.08, SEND_AT) * (1 - ramp(tc, SEND_AT + 0.05, SEND_AT + 0.2));
  /* Measured once fonts are in: where each marked word starts in the line. */
  const measure = useCallback(
    (node: HTMLSpanElement | null) => {
      if (!node) return;
      const read = () => {
        const left: Anchors["left"] = {};
        node.querySelectorAll<HTMLElement>("[data-need]").forEach((el) => {
          left[el.dataset.need as Need] = el.offsetLeft + 2;
        });
        onMeasure({ width: node.offsetWidth, height: node.offsetHeight, left });
      };
      read();
      document.fonts?.ready.then(read);
    },
    [onMeasure],
  );
  if (rest >= 1) return null;
  return (
    <>
      {m < 1 ? (
        <div
          className={styles.input}
          style={{
            left: INPUT.x,
            top: INPUT.y,
            width: INPUT.w,
            height: INPUT.h,
            ...(m > 0
              ? { opacity: 1 - m, filter: `blur(${(m * 6).toFixed(2)}px)` }
              : blurIn(tc, 0.1, 0.55, 12)),
          }}
        >
          <span
            className={styles.send}
            style={{ scale: `${1 - press * 0.12}` }}
            data-ready={tc > 1.25 || undefined}
          >
            <ArrowUp />
          </span>
        </div>
      ) : null}
      <span
        ref={measure}
        className={styles.queryText}
        style={{
          left: x - W / 2,
          top: y - H / 2,
          scale: `${lerp(1, PROMPT_SCALE, m)}`,
          ...(rest > 0 ? { opacity: 1 - rest, filter: `blur(${(rest * 6).toFixed(2)}px)` } : null),
        }}
      >
        {WORDS.map((word, i) => {
          const need = NEEDS.find((n) => n.id === word.need);
          return (
            <span
              key={word.text}
              className={styles.word}
              data-need={word.need}
              data-lit={(need && tc >= need.lit) || undefined}
              style={need && tc >= need.fly ? { opacity: 0 } : blurIn(tc, 0.45 + i * 0.08, 0.5, 8)}
            >
              {word.text}
            </span>
          );
        })}
      </span>
    </>
  );
}

/* A need's name leaves the sentence and becomes the title of its card. */
function Label({
  need,
  tc,
  anchors,
  back,
}: {
  need: NeedSpec;
  tc: number;
  anchors: Anchors | null;
  back?: CSSProperties;
}) {
  if (tc < need.fly) return null;
  const f = ramp(tc, need.fly, need.fly + FLY_LENGTH);
  const W = anchors?.width ?? 470;
  const from = 600 + ((anchors?.left[need.id] ?? W / 2) - W / 2) * PROMPT_SCALE;
  const swap = blurSwap(tc, need.fly + 0.2, 0.45);
  const word = WORDS.find((w) => w.need === need.id)!.text;
  return (
    <span
      className={styles.label}
      data-lit={f < 0.6 || undefined}
      style={{
        left: lerp(from, LIST.label, f),
        top: lerp(PROMPT_Y, need.y, f) - 10,
        scale: `${lerp(FLY_SCALE, 1, f)}`,
        ...swap.style,
        ...back,
      }}
    >
      {swap.showNew ? need.label : word}
    </span>
  );
}

function StatusIcon({ status }: { status?: Status }) {
  if (status === "ok") return <Check />;
  if (status === "miss") return <X />;
  if (status === "loading") return <i className={styles.spinner} />;
  return null;
}

/* The chip on the age-group line: no endpoint, then the interpreter, which
   opens into a card that streams its script and closes once it has run. */
function Gap({ tc }: { tc: number }) {
  const at = AGE.draw + 0.25;
  if (tc < at) return null;
  const open = ramp(tc, OPEN[0], OPEN[1]) * (1 - ramp(tc, CLOSE[0], CLOSE[1]));
  const swap = blurSwap(tc, INTERP_AT, 0.45);
  const done = tc >= DONE_AT;
  const chip = clamp01(1 - open / 0.3);
  const card = clamp01((open - 0.55) / 0.45);
  return (
    <div
      className={styles.gap}
      data-state={!swap.showNew ? "miss" : done ? "ok" : "run"}
      data-open={open > 0 || undefined}
      style={{
        left: XM,
        top: GAP_Y - GAP.h / 2,
        width: lerp(GAP.w, GAP.openW, open),
        height: lerp(GAP.h, GAP.openH, open),
        ...blurIn(tc, at, 0.4),
      }}
    >
      {chip > 0 ? (
        <span className={styles.gapChip} style={{ opacity: chip, ...swap.style }}>
          {swap.showNew ? (
            <>
              <ShieldCheck />
              Interpreter
              <StatusIcon status={done ? "ok" : "loading"} />
            </>
          ) : (
            <>
              <X />
              No endpoint
            </>
          )}
        </span>
      ) : null}
      {card > 0 ? (
        <div className={styles.gapCard} style={{ opacity: card }}>
          <div className={styles.gapHead}>
            <ShieldCheck />
            Interpreter
            <span className={styles.gapStatus} data-done={done || undefined}>
              {done ? (
                <span style={blurIn(tc, DONE_AT, 0.35, 0)}>
                  <Check /> Done
                </span>
              ) : (
                <>
                  <i className={styles.spinner} /> Running
                </>
              )}
            </span>
          </div>
          <span className={styles.code}>
            {CODE.map((line, i) => (
              <span key={line} style={blurIn(tc, CODE_AT + i * 0.22, 0.4, 4)}>
                {line}
              </span>
            ))}
          </span>
        </div>
      ) : null}
    </div>
  );
}

/* Rails of chevrons, the way the AppLess and OUI-1 illustrations draw a flow.
   Each draws out from its need, and a highlight runs along it while the
   request is in flight. */
const CHEVRONS = Array.from(
  { length: Math.floor((X1 - X0 - 24) / 12) + 1 },
  (_, i) => X0 + 12 + i * 12,
);

function DataGraph({ tc, anchors }: { tc: number; anchors: Anchors | null }) {
  if (tc < AGE.fly - 0.2) return null;
  /* While the interpreter is open, everything else steps back. */
  const open = ramp(tc, OPEN[0], OPEN[1]) * (1 - ramp(tc, CLOSE[0], CLOSE[1]));
  const back: CSSProperties | undefined =
    open > 0 ? { opacity: 1 - open * 0.8, filter: `blur(${(open * 3).toFixed(2)}px)` } : undefined;
  const bump = NEEDS.reduce((m, n) => {
    const at = n.endpoint ? n.draw + 0.8 : HEAL_AT + 0.3;
    return Math.max(m, ramp(tc, at, at + 0.12) * (1 - ramp(tc, at + 0.12, at + 0.45)));
  }, 0);
  return (
    <>
      <div
        className={styles.list}
        style={{
          left: LIST.x,
          top: LIST.y,
          width: LIST.w,
          height: LIST.h,
          ...(back ?? blurIn(tc, NEEDS[0].fly + 0.35, 0.45, 0)),
        }}
      >
        {NEEDS.map((n) => {
          const Icon = n.icon;
          return (
            <span key={n.id} className={styles.row} data-state={statusAt(n, tc)}>
              <span className={styles.rowIcon}>
                <Icon />
              </span>
            </span>
          );
        })}
      </div>
      <svg
        className={styles.rails}
        width="1200"
        height="600"
        viewBox="0 0 1200 600"
        fill="none"
        style={back}
      >
        {NEEDS.map((n) => {
          const a = ramp(tc, n.draw, n.draw + 0.3);
          const b = n.endpoint
            ? ramp(tc, n.draw + 0.5, n.draw + 0.8)
            : ramp(tc, HEAL_AT, HEAL_AT + 0.35);
          const status = statusAt(n, tc);
          const flow = status === "loading" ? (tc * 1.6) % 1 : -1;
          return a > 0 ? (
            <g key={n.id} data-tone={status}>
              {CHEVRONS.map((x) => {
                const u = (x - X0) / (X1 - X0);
                if (u <= 0.5 ? u > a * 0.5 : u - 0.5 > b * 0.5) return null;
                const glow = flow < 0 ? 1 : 0.3 + 0.7 * Math.max(0, 1 - Math.abs(u - flow) * 6);
                return (
                  <path
                    key={x}
                    d={`M${x - 2} ${n.y - 4} L${x + 2} ${n.y} L${x - 2} ${n.y + 4}`}
                    opacity={glow.toFixed(3)}
                  />
                );
              })}
            </g>
          ) : null;
        })}
      </svg>
      {NEEDS.map((n) => (
        <Label key={n.id} need={n} tc={tc} anchors={anchors} back={back} />
      ))}
      {NEEDS.map((n) => {
        const at = n.draw + 0.25;
        if (!n.endpoint || tc < at) return null;
        const ok = tc >= n.draw + 0.85;
        return (
          <span
            key={n.id}
            className={styles.chip}
            data-ok={ok || undefined}
            style={{ left: XM, top: n.y, ...(back ?? blurIn(tc, at, 0.35, 0)) }}
          >
            <StatusIcon status={ok ? "ok" : "loading"} />
            {n.endpoint}
          </span>
        );
      })}
      <Gap tc={tc} />
      {tc >= 3.9 ? (
        <div
          className={styles.dbTile}
          style={{
            left: DB.x,
            top: DB.y,
            width: DB.w,
            height: DB.h,
            scale: `${1 + bump * 0.03}`,
            ...(back ?? blurIn(tc, 3.9, 0.5, 0)),
          }}
        >
          <span className={styles.dbLogo}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <image href="/integration-logos/postgresql-white.svg" width="24" height="24" />
            </svg>
          </span>
          <span className={styles.dbName}>PostgreSQL</span>
          <span className={styles.dbMeta}>database</span>
        </div>
      ) : null}
    </>
  );
}

/* ---------- Themes ---------- */

const SWITCHES = [
  { at: 19.9, to: 1 },
  { at: 21.7, to: 2 },
];
const SWAP = 0.55;
const TAB_W = 104;
const TABS = { x: 600 - (TAB_W * LOOKS.length + 8) / 2, y: TABS_Y, h: 40 };
const tabCentre = (i: number) => ({
  x: TABS.x + 4 + TAB_W * i + TAB_W / 2,
  y: TABS.y + TABS.h / 2,
});

/* The pill and the restyle share one clock: both move with the same eased
   progress, and the wipe runs the way the pill travels. */
function themeAt(tc: number) {
  let from = 0;
  for (const s of SWITCHES) {
    if (tc < s.at) return { from, to: from, p: 0, pos: from };
    const p = ramp(tc, s.at, s.at + SWAP, ease);
    if (p < 1) return { from, to: s.to, p, pos: lerp(from, s.to, p) };
    from = s.to;
  }
  return { from, to: from, p: 0, pos: from };
}

/* ---------- The edit: the chart lifts out over a blurred dashboard ---------- */

const LIFT = { x: 600 - (REV.w * 1.45) / 2, y: 82, s: 1.45 };
const LIFT_AT: [number, number] = [24.6, 25.3];
const DROP_AT: [number, number] = [27.9, 28.6];
const EDIT = { x: LIFT.x, y: LIFT.y + REV.h * LIFT.s + 18, w: REV.w * LIFT.s, h: 48 };
const EDIT_WORDS = ["Show", "this", "as", "a", "donut", "chart"];

/* ---------- Cursor: screen keys ("s") or world keys ("w") ---------- */

type CursorKey = [number, "s" | "w", number, number];
const SEND = { x: EDIT.x + EDIT.w - 22, y: EDIT.y + EDIT.h / 2 };
const REV_AIM = { x: REV.x + REV.w / 2, y: REV.y + 120 };
const CURSOR: CursorKey[] = [
  [19.0, "s", 1160, 650],
  [19.7, "s", tabCentre(1).x, tabCentre(1).y],
  [21.3, "s", tabCentre(1).x, tabCentre(1).y],
  [21.6, "s", tabCentre(2).x, tabCentre(2).y],
  [23.2, "s", tabCentre(2).x, tabCentre(2).y],
  [24.3, "w", REV_AIM.x, REV_AIM.y],
  [25.3, "w", REV_AIM.x, REV_AIM.y],
  [25.9, "s", SEND.x, SEND.y],
  [26.5, "s", SEND.x, SEND.y],
  [27.2, "s", 1260, 700],
];
const CLICKS = [19.85, 21.65, 24.45, 26.25];

const toScreen = (cam: Cam, x: number, y: number) => ({
  x: 600 + (x - cam.cx) * cam.s,
  y: 300 + (y - cam.cy) * cam.s,
});

function cursorAt(tc: number, cam: Cam) {
  const at = (k: CursorKey) => (k[1] === "s" ? { x: k[2], y: k[3] } : toScreen(cam, k[2], k[3]));
  if (tc <= CURSOR[0][0]) return at(CURSOR[0]);
  for (let i = 0; i < CURSOR.length - 1; i++) {
    const a = CURSOR[i];
    const b = CURSOR[i + 1];
    if (tc <= b[0]) {
      const p = ramp(tc, a[0], b[0]);
      const pa = at(a);
      const pb = at(b);
      return { x: lerp(pa.x, pb.x, p), y: lerp(pa.y, pb.y, p) };
    }
  }
  return at(CURSOR[CURSOR.length - 1]);
}

/* ---------- Camera ---------- */

const CAMERA: CamKey[] = [
  [0, 600, 300, 1],
  [3.4, 600, 300, 1],
  [7.9, 600, 300, 1.12],
  [OPEN[0], 600, 300, 1.12],
  [OPEN[1], XM, GAP_OPEN_Y, 1.75],
  [CLOSE[0], XM, GAP_OPEN_Y, 1.75],
  [CLOSE[1], 600, 300, 1.12],
  [12.5, 600, 300, 1.12],
  [13.4, VIEW.cx, VIEW.cy, VIEW.s],
  [14.7, VIEW.cx, VIEW.cy, VIEW.s],
  [15.5, PUSH.cx, PUSH.cy, PUSH.s],
  [18.0, PUSH.cx, PUSH.cy, PUSH.s],
  [18.8, BRAND.cx, BRAND.cy, BRAND.s],
  [23.2, BRAND.cx, BRAND.cy, BRAND.s],
  [24.0, VIEW.cx, VIEW.cy, VIEW.s],
  [28.8, VIEW.cx, VIEW.cy, VIEW.s],
  [29.5, 600, 300, 1],
];

/* On a phone the frame is 900px wide, so the two widest shots (the data
   graph and the refresh push) pull back just enough to fit. */
const CAMERA_NARROW: CamKey[] = CAMERA.map(([t, x, y, sc]) => [
  t,
  x,
  y,
  sc === 1.12 ? 0.95 : sc === PUSH.s ? 0.88 : sc,
]);

/* ---------- Film ---------- */

export function Film({
  T,
  look: chosenLook = null,
  onLook,
}: {
  T: number;
  /** A theme the reader picked; it replaces the scripted switches. */
  look?: LookId | null;
  onLook?: (look: LookId) => void;
}) {
  const [anchors, setAnchors] = useState<Anchors | null>(null);
  /* The looks keep one order on every page. The first two follow the page's
     mode and the last, where the edit happens, takes the other one. */
  const dark = useDark();
  const looks = LOOKS;
  const modeOf = (id: LookId): Mode =>
    looks.findIndex((l) => l.id === id) < 2 === dark ? "dark" : "light";
  const tc = T >= RESET ? 0 : T;
  const cam = camAt(useNarrow() ? CAMERA_NARROW : CAMERA, T);
  const whip = ramp(T, 28.8, 29.5);
  const blur = Math.sin(Math.PI * whip) * 8;

  const lift = ramp(tc, LIFT_AT[0], LIFT_AT[1]) * (1 - ramp(tc, DROP_AT[0], DROP_AT[1]));
  const donut = ramp(tc, 26.45, 27.2);
  const state = { T: tc, build: BUILD_AT, refreshAt: REFRESH_AT, donut, lifted: lift > 0 };

  const theme = chosenLook ? null : themeAt(tc);
  const activeIndex = chosenLook ? looks.findIndex((l) => l.id === chosenLook) : theme!.pos;
  const layers: { look: LookId; style?: CSSProperties }[] = [];
  if (theme && theme.p > 0 && theme.p < 1) {
    const forward = theme.to > theme.from;
    const cut = ((1 - theme.p) * 100).toFixed(2);
    layers.push({ look: looks[theme.from].id });
    layers.push({
      look: looks[theme.to].id,
      style: {
        clipPath: forward ? `inset(-40px ${cut}% -40px -40px)` : `inset(-40px -40px -40px ${cut}%)`,
      },
    });
  } else {
    layers.push({ look: chosenLook ?? looks[theme!.from].id });
  }

  const tabsIn = tc >= 18.5 && tc < 23.5;
  const tabsOut = ramp(tc, 23.2, 23.5);
  const tabsStyle =
    tabsOut > 0
      ? { opacity: 1 - tabsOut, filter: `blur(${(tabsOut * 6).toFixed(2)}px)` }
      : blurIn(tc, 18.5);

  const showCursor = !chosenLook && tc >= 19.0 && tc < 27.2;
  const pointer = cursorAt(tc, cam);
  const press = CLICKS.reduce(
    (m, c) => Math.max(m, ramp(tc, c - 0.08, c) * (1 - ramp(tc, c + 0.06, c + 0.2))),
    0,
  );

  const from = toScreen(cam, REV.x, REV.y);
  const promptOut = ramp(tc, 27.7, 28.0);

  return (
    <div className={styles.viewport}>
      <div
        className={styles.world}
        aria-hidden="true"
        style={{
          transform: `translate(${(600 - cam.cx * cam.s).toFixed(2)}px, ${(300 - cam.cy * cam.s).toFixed(2)}px) scale(${cam.s.toFixed(4)})`,
          filter: blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : undefined,
        }}
      >
        {tc < 14 ? (
          <>
            <Query tc={tc} anchors={anchors} onMeasure={setAnchors} />
            <DataGraph tc={tc} anchors={anchors} />
          </>
        ) : null}
        {tc >= BUILD_AT ? (
          <div
            className={styles.dash}
            style={{
              left: DASH.x,
              top: DASH.y,
              width: DASH.w,
              height: DASH.h,
              ...(lift > 0
                ? { opacity: 1 - lift * 0.3, filter: `blur(${(lift * 7).toFixed(2)}px)` }
                : null),
            }}
          >
            {layers.map((layer) => (
              <div key={layer.look} className={styles.layer} style={layer.style}>
                <Dashboard look={layer.look} mode={modeOf(layer.look)} state={state} />
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {lift > 0 ? (
        <div
          className={styles.lift}
          style={{
            width: REV.w,
            height: REV.h,
            transform: `translate(${lerp(from.x, LIFT.x, lift).toFixed(2)}px, ${lerp(from.y, LIFT.y, lift).toFixed(2)}px) scale(${lerp(cam.s, LIFT.s, lift).toFixed(4)})`,
          }}
          aria-hidden="true"
        >
          <RevenueCard
            look={layers[layers.length - 1].look}
            mode={modeOf(layers[layers.length - 1].look)}
            state={state}
            lift={lift}
          />
        </div>
      ) : null}

      {tc >= 25.2 && promptOut < 1 ? (
        <div
          className={styles.prompt}
          style={{
            left: EDIT.x,
            top: EDIT.y,
            width: EDIT.w,
            height: EDIT.h,
            ...(promptOut > 0
              ? { opacity: 1 - promptOut, filter: `blur(${(promptOut * 6).toFixed(2)}px)` }
              : blurIn(tc, 25.2)),
          }}
          aria-hidden="true"
        >
          <span className={styles.promptText}>
            {EDIT_WORDS.map((w, i) => (
              <span key={w} style={blurIn(tc, 25.4 + i * 0.07, 0.45, 4)}>
                {w}
              </span>
            ))}
          </span>
          <span className={styles.send} data-ready data-pressed={tc >= 26.25 || undefined}>
            <ArrowUp />
          </span>
        </div>
      ) : null}

      {tabsIn || chosenLook ? (
        <div
          className={styles.tabs}
          role="group"
          aria-label="Theme"
          style={{ left: TABS.x, top: TABS.y, height: TABS.h, ...(chosenLook ? null : tabsStyle) }}
        >
          <span
            className={styles.tabPill}
            data-user={chosenLook ? true : undefined}
            style={{ width: TAB_W, translate: `${(activeIndex * TAB_W).toFixed(2)}px 0` }}
            aria-hidden="true"
          />
          {looks.map((l, i) => (
            <button
              key={l.id}
              type="button"
              className={styles.tab}
              style={{ width: TAB_W }}
              aria-pressed={Math.round(activeIndex) === i}
              data-on={Math.round(activeIndex) === i || undefined}
              onClick={() => onLook?.(l.id)}
            >
              {l.label}
            </button>
          ))}
        </div>
      ) : null}

      {showCursor ? (
        <svg
          className={styles.cursor}
          viewBox="0 0 24 24"
          style={{ left: pointer.x, top: pointer.y, scale: `${1 - press * 0.12}` }}
          aria-hidden="true"
        >
          <path d="M4 2.5v17l4.6-4.4 3 6.4 2.7-1.2-3-6.3H17L4 2.5Z" />
        </svg>
      ) : null}
    </div>
  );
}

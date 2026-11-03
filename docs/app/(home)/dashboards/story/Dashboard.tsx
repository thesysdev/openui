import {
  BadgeDollarSign,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  Download,
  Ellipsis,
  Hash,
  type LucideIcon,
  MailOpen,
  MousePointerClick,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  SquareArrowOutUpRight,
  SquarePlus,
  TrendingUp,
  Users,
} from "lucide-react";
import type { CSSProperties } from "react";
import styles from "./Dashboard.module.css";
import { blurIn, clamp01, easeOut, grown, lerp, pop, ramp } from "./motion";

/* One newsletter dashboard in three design languages, each taken from its
   reference: Studio from the Marketing dashboard, Vivid from Support
   Analytics, Midnight from the dark overview. The regions sit in the same
   places in every look, so a theme switch restyles in place. */
export const LOOKS = [
  { id: "midnight", label: "Graphite" },
  { id: "studio", label: "Indigo" },
  { id: "vivid", label: "Pastel" },
] as const;
export type LookId = (typeof LOOKS)[number]["id"];
/* Every look comes in light and dark. */
export type Mode = "light" | "dark";

/* px inside the 1000x700 dashboard, measured inside its 1px border. */
export const REVENUE_CARD = { x: 725, y: 213, w: 254, h: 270 };

export type DashState = {
  /** Film time. */
  T: number;
  /** When the blocks start streaming in. */
  build: number;
  /** When the automatic refresh lands. */
  refreshAt: number;
  /** 0 shows revenue in the look's own chart, 1 as a donut. */
  donut: number;
  /** The revenue card is lifted out for an edit, so its slot stays empty. */
  lifted: boolean;
};

/* The blocks stream in, in reading order, each rising out of a short blur. */
const ORDER = {
  head: 0,
  k0: 0.12,
  k1: 0.2,
  k2: 0.28,
  k3: 0.36,
  chart: 0.5,
  revenue: 0.6,
  table: 0.72,
};
export const BUILD_LENGTH = 1.25;
/* Streaming, as in the homepage's Intelligent UI comparison: each block pops
   up into place when the stream reaches it, then its bars grow one after
   another and its lines draw on. */
const arrive = (s: DashState, id: keyof typeof ORDER) => pop(s.T, s.build + ORDER[id]);
type Grow = { g: (i: number) => number; draw: number };
const growth = (s: DashState, id: keyof typeof ORDER): Grow => {
  const t0 = s.build + ORDER[id] + 0.15;
  return { g: (i) => grown(s.T, t0 + i * 0.04), draw: ramp(s.T, t0, t0 + 0.9) };
};

/* ---------- Content ---------- */

const TITLE: Record<LookId, string> = {
  studio: "Newsletter analytics",
  vivid: "Your newsletter",
  midnight: "Newsletter performance",
};

type Kpi = {
  icon: LucideIcon;
  value: [string, string];
  delta: string;
  label: Record<LookId, string>;
  note: string;
};
const KPIS: Kpi[] = [
  {
    icon: Users,
    value: ["18,420", "18,436"],
    delta: "8.2%",
    label: { studio: "Active subscribers", vivid: "Subscribers", midnight: "Active subscribers" },
    note: "Net audience growth",
  },
  {
    icon: MailOpen,
    value: ["47.8%", "47.9%"],
    delta: "3.1%",
    label: { studio: "Open rate", vivid: "Opens", midnight: "Average open rate" },
    note: "Across your latest campaigns",
  },
  {
    icon: MousePointerClick,
    value: ["18.6%", "18.7%"],
    delta: "1.9%",
    label: { studio: "CTR", vivid: "Clicks", midnight: "Click rate" },
    note: "Audience link engagement",
  },
  {
    icon: BadgeDollarSign,
    value: ["1,284", "1,286"],
    delta: "6.4%",
    label: { studio: "Paid subscribers", vivid: "Paid members", midnight: "Paid subscribers" },
    note: "Active paid members",
  },
];

/* The last 12 months, ending this month. */
const MONTHS = ["Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov"];
const OPEN = [40.8, 41.2, 42.6, 42.1, 44.8, 49.2, 45.9, 44.1, 46.7, 47.5, 46.9, 47.8];
const CLICK = [14.2, 14.8, 15.6, 15.2, 16.9, 19.8, 17.6, 16.8, 18.1, 18.4, 18.2, 18.6];
const NOW = { open: 48.6, click: 19.2 };

const SOURCES = [
  { label: "Paid subscriptions", value: [5240, 5240], prev: 4810 },
  { label: "Sponsorships", value: [2180, 2240], prev: 2350 },
  { label: "Digital products", value: [1040, 1040], prev: 860 },
];
const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

const CAMPAIGNS = [
  {
    name: "Weekly Creator Brief",
    sent: "Nov 2, 2026",
    to: 17840,
    opened: ["8,024", "8,061"],
    clicked: ["3,186", "3,201"],
    status: "Sending",
  },
  {
    name: "AI Tools Worth Trying",
    sent: "Oct 26, 2026",
    to: 17620,
    opened: ["8,986", "8,986"],
    clicked: ["2,490", "2,490"],
    status: "Delivered",
  },
  {
    name: "The Creator Economy Report",
    sent: "Oct 19, 2026",
    to: 17310,
    opened: ["8,214", "8,214"],
    clicked: ["2,436", "2,436"],
    status: "Delivered",
  },
];
const num = (s: string) => Number(s.replace(/[^\d.]/g, ""));

/* ---------- Refresh: a fixed status line, digits that roll ---------- */

/* Changed digits roll up like a slot machine, one column after the next.
   Nothing blurs or fades, and nothing changes width. */
const spin = (a: string, b: string) => {
  const out = [a];
  for (let d = Number(a); String(d) !== b;) {
    d = (d + 1) % 10;
    out.push(String(d));
  }
  return out;
};

function Roll({
  s,
  value,
  className,
}: {
  s: DashState;
  value: [string, string];
  className?: string;
}) {
  const [from, to] = value;
  const start = s.refreshAt;
  if (from === to || s.T < start) return <span className={className}>{from}</span>;
  if (s.T >= start + 1.2) return <span className={className}>{to}</span>;
  const order = to
    .split("")
    .map((c, i) => [...to.slice(0, i)].filter((d, j) => d !== from[j]).length);
  return (
    <span className={className}>
      {to.split("").map((c, i) => {
        const a = from[i];
        if (a === c) return <span key={i}>{c}</span>;
        const strip = /\d/.test(a) && /\d/.test(c) ? spin(a, c) : [a, c];
        const k = order[i];
        const p = ramp(s.T, start + k * 0.08, start + 0.55 + k * 0.08, easeOut);
        return (
          <span key={i} className={styles.slot}>
            <span style={{ translate: `0 ${(-p * (strip.length - 1) * 100) / strip.length}%` }}>
              {strip.map((d, j) => (
                <span key={j}>{d}</span>
              ))}
            </span>
          </span>
        );
      })}
    </span>
  );
}

const STATUS = [
  { text: "Updated 1m ago", icon: RefreshCw },
  { text: "Refreshing now", icon: RefreshCw },
  { text: "Just refreshed", icon: Check },
];

/* One slot: the old line rolls up and out as the new one rolls in. */
function Status({ s }: { s: DashState }) {
  const at = [-Infinity, s.refreshAt - 0.8, s.refreshAt + 1.0];
  const i = at.reduce((k, t, j) => (s.T >= t ? j : k), 0);
  const p = i > 0 ? ramp(s.T, at[i], at[i] + 0.35) : 1;
  const lines = i > 0 && p < 1 ? [STATUS[i - 1], STATUS[i]] : [STATUS[i]];
  const spinning = i === 1 || (i === 2 && p < 1);
  return (
    <span className={styles.status} data-state={i}>
      <span className={styles.statusIcon} data-spin={spinning || undefined}>
        {i === 2 && p >= 0.5 ? <Check /> : <RefreshCw />}
      </span>
      <span className={styles.statusSlot}>
        <span style={lines.length > 1 ? { translate: `0 ${-p * 50}%` } : undefined}>
          {lines.map((l) => (
            <span key={l.text}>{l.text}</span>
          ))}
        </span>
      </span>
    </span>
  );
}

const refreshed = (s: DashState) => ramp(s.T, s.refreshAt + 0.2, s.refreshAt + 0.9);
const series = (s: DashState) => {
  const r = refreshed(s);
  return {
    open: [...OPEN.slice(0, -1), lerp(OPEN[11], NOW.open, r)],
    click: [...CLICK.slice(0, -1), lerp(CLICK[11], NOW.click, r)],
  };
};
const sources = (s: DashState) => {
  const r = refreshed(s);
  return SOURCES.map((src) => lerp(src.value[0], src.value[1], r));
};

/* ---------- Header ---------- */

function Head({ look, s }: { look: LookId; s: DashState }) {
  return (
    <div className={styles.head} style={arrive(s, "head")}>
      <span className={styles.title}>{TITLE[look]}</span>
      <span className={styles.actions}>
        <Status s={s} />
        {look === "vivid" ? (
          <>
            <span className={styles.segment}>
              <span>7 days</span>
              <span data-on>30 days</span>
              <span>90 days</span>
            </span>
            <span className={styles.iconButton}>
              <Download />
            </span>
          </>
        ) : look === "studio" ? (
          <>
            <span className={styles.iconButton}>
              <Bell />
            </span>
            <span className={styles.select}>
              <SlidersHorizontal />
              Filters
            </span>
            <span className={styles.button}>
              <Plus />
              New campaign
            </span>
          </>
        ) : (
          <>
            <span className={styles.select}>
              <CalendarDays />
              Last 30 days
              <ChevronDown />
            </span>
            <span className={styles.button}>
              <SquarePlus />
              Create campaign
            </span>
          </>
        )}
      </span>
    </div>
  );
}

/* ---------- Metrics ---------- */

function Metric({ look, s, kpi, i }: { look: LookId; s: DashState; kpi: Kpi; i: number }) {
  const Icon = kpi.icon;
  return (
    <div className={styles.kpi} data-i={i} style={arrive(s, `k${i}` as keyof typeof ORDER)}>
      <span className={styles.kpiTop}>
        <span className={styles.kpiChip}>
          <span className={styles.icon}>
            <Icon />
          </span>
          <span className={styles.kpiLabel}>{kpi.label[look]}</span>
        </span>
        <span className={styles.kpiAction}>
          {look === "vivid" ? <SquareArrowOutUpRight /> : <Ellipsis />}
        </span>
      </span>
      <Roll s={s} value={kpi.value} className={styles.kpiValue} />
      <span className={styles.kpiFoot}>
        <span className={styles.delta}>
          <TrendingUp />
          {look === "studio" ? `+${kpi.delta}` : look === "midnight" ? `+${kpi.delta}` : kpi.delta}
        </span>
        <span className={styles.note}>{look === "vivid" ? "vs last month" : kpi.note}</span>
      </span>
    </div>
  );
}

/* ---------- Audience engagement ---------- */

const CW = 652;
const CH = 178;
const AX = 34;
const BOT = 22;
const PLOT = CH - BOT;
const valY = (v: number) => PLOT * (1 - v / 60);
const monthX = (i: number) => AX + ((CW - AX) / 12) * (i + 0.5);

function Axis({ look }: { look: LookId }) {
  return (
    <>
      {[0, 15, 30, 45, 60].map((v) => (
        <g key={v}>
          {look === "midnight" ? null : (
            <line className={styles.gridLine} x1={AX} x2={CW} y1={valY(v)} y2={valY(v)} />
          )}
          <text className={styles.tick} x={0} y={valY(v) + 3.5}>
            {v}%
          </text>
        </g>
      ))}
      {MONTHS.map((m, i) =>
        look === "vivid" && i % 2 ? null : (
          <text key={m} className={styles.tick} x={monthX(i)} y={CH - 4} textAnchor="middle">
            {m}
          </text>
        ),
      )}
    </>
  );
}

/* Midnight: four columns of small squares a month. Clicks fill from the
   bottom in lavender (the selected month in purple), opens stack above. */
const WEEKS = 48;
const PITCH = (CW - AX) / WEEKS;
const SQ = PITCH - 3.4;
const ROWS = Math.floor(PLOT / PITCH);
const wave = (i: number) => Math.sin(i * 1.7) * 0.9 + Math.sin(i * 0.53 + 1) * 1.1;

function Squares({ open, click, g }: { open: number[]; click: number[] } & Grow) {
  return (
    <svg viewBox={`0 0 ${CW} ${CH}`} className={styles.chart} aria-hidden="true">
      <Axis look="midnight" />
      {Array.from({ length: WEEKS }, (_, w) => {
        const m = Math.floor(w / 4);
        const o = (open[m] + wave(w) * 6) / (60 / ROWS);
        const c = (click[m] + wave(w + 9) * 1.5) / (60 / ROWS);
        const top = Math.max(2, Math.min(ROWS, Math.round(o)));
        const x = AX + w * PITCH + 1.7;
        return Array.from({ length: Math.round(top * g(w / 3)) }, (_, r) => (
          <rect
            key={`${w}-${r}`}
            className={styles.square}
            data-k={r < Math.round(c) ? (m === 5 ? "hot" : "click") : undefined}
            x={x}
            y={PLOT - (r + 1) * PITCH + 1.7}
            width={SQ}
            height={SQ}
            rx={2}
          />
        ));
      })}
      {Array.from({ length: WEEKS + 1 }, (_, w) => (
        <line
          key={w}
          className={styles.tickMark}
          x1={AX + w * PITCH}
          x2={AX + w * PITCH}
          y1={PLOT + 3}
          y2={PLOT + 6}
        />
      ))}
      <line className={styles.cursor} x1={monthX(5)} x2={monthX(5)} y1={2} y2={PLOT} />
      <circle className={styles.cursorDot} cx={monthX(5)} cy={valY(open[5])} r={3} />
      <g className={styles.tip} transform={`translate(${monthX(5) + 12} 4)`}>
        <rect width="96" height="52" rx="4" />
        <text x="9" y="16" data-b>
          May 2026
        </text>
        <text x="9" y="32">
          Open:
        </text>
        <text x="87" y="32" textAnchor="end">
          {open[5]}%
        </text>
        <text x="9" y="45">
          Click:
        </text>
        <text x="87" y="45" textAnchor="end">
          {click[5]}%
        </text>
      </g>
    </svg>
  );
}

/* Studio: open rate as bars, click rate as a line over them. */
function BarsLine({ open, click, g, draw }: { open: number[]; click: number[] } & Grow) {
  const w = ((CW - AX) / 12) * 0.62;
  const line = click
    .map((v, i) => `${i ? "L" : "M"}${monthX(i).toFixed(1)} ${valY(v * 2.2).toFixed(1)}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${CW} ${CH}`} className={styles.chart} aria-hidden="true">
      <Axis look="studio" />
      {open.map((v, i) => (
        <path
          key={MONTHS[i]}
          className={styles.bar}
          d={`M${monthX(i) - w / 2} ${PLOT} V${Math.min(PLOT - 4, valY(v * g(i)) + 4)} q0 -4 4 -4 h${w - 8} q4 0 4 4 V${PLOT} Z`}
          opacity={g(i) > 0 ? undefined : 0}
        />
      ))}
      <path className={styles.line2} d={line} pathLength={1} strokeDasharray={`${draw} 1`} />
    </svg>
  );
}

/* Vivid: lines inside a soft panel, the latest month marked. */
function Lines({ open, click, draw }: { open: number[]; click: number[] } & Grow) {
  const path = (vals: number[]) =>
    vals.map((v, i) => `${i ? "L" : "M"}${monthX(i).toFixed(1)} ${valY(v).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${CW} ${CH}`} className={styles.chart} aria-hidden="true">
      <rect className={styles.panel} x={AX - 6} y={0} width={CW - AX + 6} height={PLOT} rx={8} />
      <Axis look="vivid" />
      <path
        className={styles.area}
        d={`${path(open)} L${monthX(11)} ${PLOT} L${monthX(0)} ${PLOT} Z`}
        style={{ opacity: 0.12 * draw }}
      />
      <path className={styles.line1} d={path(open)} pathLength={1} strokeDasharray={`${draw} 1`} />
      <path className={styles.line2} d={path(click)} pathLength={1} strokeDasharray={`${draw} 1`} />
      <line className={styles.cursor} x1={monthX(5)} x2={monthX(5)} y1={0} y2={PLOT} />
      <circle className={styles.dot1} cx={monthX(11)} cy={valY(open[11])} r={4} />
      <circle className={styles.dot2} cx={monthX(11)} cy={valY(click[11])} r={4} />
    </svg>
  );
}

const CHART_TITLE: Record<LookId, string> = {
  studio: "Open rate · CTR",
  vivid: "Opens and clicks over time",
  midnight: "Audience engagement",
};

function Engagement({ look, s }: { look: LookId; s: DashState }) {
  const data = series(s);
  return (
    <div className={styles.card} data-block="chart" style={arrive(s, "chart")}>
      <div className={styles.cardHead}>
        <span className={styles.cardTitle}>{CHART_TITLE[look]}</span>
        <span className={styles.cardSide}>
          <span className={styles.legend}>
            <i data-k="click" /> Click rate <i data-k="open" /> Open rate
          </span>
          {look === "vivid" ? null : (
            <span className={styles.select}>
              <CalendarDays />
              {look === "studio" ? "This year" : "Month"}
              <ChevronDown />
            </span>
          )}
        </span>
      </div>
      {look === "midnight" ? (
        <Squares {...data} {...growth(s, "chart")} />
      ) : look === "studio" ? (
        <BarsLine {...data} {...growth(s, "chart")} />
      ) : (
        <Lines {...data} {...growth(s, "chart")} />
      )}
    </div>
  );
}

/* ---------- Newsletter revenue ---------- */

const REVENUE_TITLE: Record<LookId, string> = {
  studio: "Revenue by source",
  vivid: "Where revenue comes from",
  midnight: "Newsletter revenue",
};
const DONUT_R = 44;
const DONUT_C = 2 * Math.PI * DONUT_R;
const GAUGE = "M 24 100 A 76 76 0 0 1 176 100";

function RevenueChart({ look, now, g, draw }: { look: LookId; now: number[] } & Grow) {
  const total = now.reduce((a, b) => a + b, 0);
  const max = 6000;
  if (look === "midnight")
    return (
      <span className={styles.groups}>
        {SOURCES.map((src, i) => (
          <span key={src.label} className={styles.group}>
            <i>
              <b data-s={i} style={{ height: `${(now[i] / max) * 100 * g(i * 2)}%` }} />
            </i>
            <i>
              <b
                data-s={i}
                data-prev
                style={{ height: `${(src.prev / max) * 100 * g(i * 2 + 1)}%` }}
              />
            </i>
          </span>
        ))}
      </span>
    );
  if (look === "studio") {
    const starts = now.map((_, i) => now.slice(0, i).reduce((a, b) => a + b, 0) / total);
    return (
      <svg viewBox="0 0 200 112" className={styles.gauge} aria-hidden="true">
        {now.map((v, i) => (
          <path
            key={SOURCES[i].label}
            data-s={i}
            d={GAUGE}
            pathLength={1}
            strokeDasharray={`${Math.max(0, (v / total - 0.06) * draw)} 1`}
            strokeDashoffset={-(starts[i] + 0.03)}
          />
        ))}
        <text x="100" y="92" textAnchor="middle" className={styles.gaugeValue}>
          {Math.round((now[0] / total) * 100)}%
        </text>
        <text x="100" y="106" textAnchor="middle" className={styles.gaugeLabel}>
          Paid subscriptions
        </text>
      </svg>
    );
  }
  const pills = 22;
  const edges = [now[0] / total, (now[0] + now[1]) / total];
  return (
    <span className={styles.pills}>
      {Array.from({ length: pills }, (_, k) => {
        const u = (k + 0.5) / pills;
        return (
          <i
            key={k}
            data-s={u < edges[0] ? 0 : u < edges[1] ? 1 : 2}
            style={
              g(k * 0.5) < 1
                ? { opacity: g(k * 0.5), scale: `1 ${g(k * 0.5).toFixed(3)}` }
                : undefined
            }
          />
        );
      })}
    </span>
  );
}

function RevenueBody({ look, s }: { look: LookId; s: DashState }) {
  const now = sources(s);
  const total = now.reduce((a, b) => a + b, 0);
  const out = clamp01(s.donut * 2);
  const p = clamp01((s.donut - 0.35) / 0.65);
  return (
    <>
      <span className={styles.cardHead}>
        <span className={styles.cardTitle}>{REVENUE_TITLE[look]}</span>
        {look === "midnight" ? (
          <span className={styles.trend}>
            <TrendingUp />
            5.8%
          </span>
        ) : null}
      </span>
      <span className={styles.revenueValue}>
        <Roll s={s} value={[usd(8460), usd(8520)]} className={styles.bigValue} />
        {look === "midnight" ? null : (
          <span className={styles.delta}>
            <TrendingUp />
            {look === "studio" ? "+5.8%" : "5.8%"}
          </span>
        )}
      </span>
      <div className={styles.revenueArea}>
        {s.donut < 1 ? (
          <div
            className={styles.revenueChart}
            style={
              out > 0 ? { opacity: 1 - out, filter: `blur(${(out * 6).toFixed(2)}px)` } : undefined
            }
          >
            <RevenueChart look={look} now={now} {...growth(s, "revenue")} />
          </div>
        ) : null}
        {s.donut > 0.35 ? (
          <svg
            viewBox="0 0 110 110"
            className={styles.donut}
            style={
              p < 1 ? { opacity: p, filter: `blur(${((1 - p) * 6).toFixed(2)}px)` } : undefined
            }
            aria-hidden="true"
          >
            <circle className={styles.donutTrack} cx="55" cy="55" r={DONUT_R} />
            {now.map((v, i) => (
              <circle
                key={SOURCES[i].label}
                data-s={i}
                cx="55"
                cy="55"
                r={DONUT_R}
                strokeDasharray={`${Math.max(0, (v / total) * DONUT_C * p - 2)} ${DONUT_C}`}
                strokeDashoffset={
                  (-now.slice(0, i).reduce((a, b) => a + b, 0) / total) * DONUT_C * p
                }
              />
            ))}
          </svg>
        ) : null}
      </div>
      {look === "midnight" ? (
        <span className={styles.caption}>This month vs. previous month</span>
      ) : null}
      <ul className={styles.sources}>
        {SOURCES.map((src, i) => (
          <li key={src.label}>
            <i data-s={i} />
            <span>{src.label}</span>
            <b>
              {look === "vivid" ? <em>{Math.round((now[i] / total) * 100)}%</em> : null}
              <Roll s={s} value={[usd(src.value[0]), usd(src.value[1])]} />
            </b>
          </li>
        ))}
      </ul>
    </>
  );
}

/* The revenue card on its own, lifted out of the dashboard while it is edited.
   At lift 0 it is drawn exactly like its slot (square in Midnight's grid), so
   it leaves and returns without a jump; its corners, edge and shadow grow
   with the lift. */
export function RevenueCard({
  look,
  mode,
  state,
  lift,
}: {
  look: LookId;
  mode: Mode;
  state: DashState;
  lift: number;
}) {
  return (
    <div
      className={styles.dash}
      data-look={look}
      data-mode={mode}
      data-solo
      style={{ "--lift": lift.toFixed(4) } as CSSProperties}
    >
      <div className={styles.card} data-block="revenue">
        <RevenueBody look={look} s={state} />
      </div>
    </div>
  );
}

/* ---------- Recent campaigns ---------- */

function Campaigns({ look, s }: { look: LookId; s: DashState }) {
  const fresh = s.T >= s.refreshAt;
  return (
    <div className={styles.card} data-block="table" style={arrive(s, "table")}>
      <div className={styles.cardHead}>
        {look === "studio" ? (
          <span className={styles.tabs}>
            <span data-on>Campaigns</span>
            <span>Sources</span>
            <span>Segments</span>
          </span>
        ) : (
          <span className={styles.cardTitle}>
            {look === "vivid" ? "How campaigns did" : "Recent campaigns"}
          </span>
        )}
        {look === "vivid" ? (
          <span className={styles.cardSide}>
            <span className={styles.legend}>
              <i data-k="click" /> Clicked <i data-k="open" /> Opened <i data-k="rest" /> Not opened
            </span>
          </span>
        ) : look === "midnight" ? (
          <span className={styles.ghost}>View campaign history</span>
        ) : null}
      </div>
      <div className={styles.table}>
        {look === "studio" ? null : (
          <span className={styles.th}>
            <span>Campaign</span>
            <span>Sent</span>
            <span>{look === "vivid" ? "Outcome" : "Opened"}</span>
            <span>{look === "vivid" ? "Open rate" : "Status"}</span>
            <span>Clicked</span>
          </span>
        )}
        {CAMPAIGNS.map((c, i) => {
          const opened = num(fresh ? c.opened[1] : c.opened[0]);
          const clicked = num(fresh ? c.clicked[1] : c.clicked[0]);
          const rate = Math.round((opened / c.to) * 100);
          if (look === "studio")
            return (
              <span key={c.name} className={styles.tr}>
                <span className={styles.barName}>
                  <i style={{ width: `${rate * 1.6}%` }} />
                  <span>{c.name}</span>
                </span>
                <span>{c.sent}</span>
                <Roll s={s} value={c.opened as [string, string]} />
                <b>{rate}%</b>
              </span>
            );
          return (
            <span key={c.name} className={styles.tr}>
              <span className={styles.name}>
                {look === "vivid" ? <Hash /> : <i data-i={i} />}
                {c.name}
              </span>
              <span>{c.sent}</span>
              {look === "vivid" ? (
                <span className={styles.split}>
                  <i data-k="click" style={{ flexGrow: clicked }} />
                  <i data-k="open" style={{ flexGrow: opened - clicked }} />
                  <i data-k="rest" style={{ flexGrow: c.to - opened }} />
                </span>
              ) : (
                <Roll s={s} value={c.opened as [string, string]} />
              )}
              {look === "vivid" ? (
                <b>{rate}%</b>
              ) : (
                <span>
                  <span className={styles.pill} data-live={c.status === "Sending" || undefined}>
                    <i />
                    {c.status}
                  </span>
                </span>
              )}
              <Roll s={s} value={c.clicked as [string, string]} className={styles.right} />
            </span>
          );
        })}
      </div>
    </div>
  );
}

export function Dashboard({
  look,
  mode,
  state: s,
}: {
  look: LookId;
  mode: Mode;
  state: DashState;
}) {
  return (
    <div
      className={styles.dash}
      data-look={look}
      data-mode={mode}
      style={blurIn(s.T, s.build - 0.1, 0.4, 0)}
    >
      <Head look={look} s={s} />
      <div className={styles.kpis}>
        {KPIS.map((kpi, i) => (
          <Metric key={kpi.note} look={look} s={s} kpi={kpi} i={i} />
        ))}
      </div>
      <div className={styles.charts}>
        <Engagement look={look} s={s} />
        <div
          className={styles.card}
          data-block="revenue"
          data-emptied={s.lifted || undefined}
          style={s.lifted ? undefined : arrive(s, "revenue")}
        >
          <RevenueBody look={look} s={s} />
        </div>
      </div>
      <Campaigns look={look} s={s} />
    </div>
  );
}

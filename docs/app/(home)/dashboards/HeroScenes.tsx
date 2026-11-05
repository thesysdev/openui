"use client";

import {
  BatteryFull,
  Bell,
  Briefcase,
  CalendarDays,
  Check,
  ChevronDown,
  Download,
  Ellipsis,
  Handshake,
  Hourglass,
  Inbox,
  Landmark,
  type LucideIcon,
  PackageCheck,
  PiggyBank,
  Plus,
  Receipt,
  RefreshCw,
  Signal,
  SlidersHorizontal,
  Smile,
  SquareArrowOutUpRight,
  Target,
  Timer,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
  Truck,
  Wallet,
  Wifi,
} from "lucide-react";
import { type ReactNode, type RefObject, useEffect, useState } from "react";
import styles from "./HeroScenes.module.css";
import { easeOut, focus, grown, lerp, pop, ramp } from "./story/motion";

/* The hero's four dashboards, one per use case and form factor, each in one
   of the reference design languages, all light. They stream in when a tab
   opens, then refresh in place on a loop: the status line rolls, changed
   digits roll over, and the charts move to the new data. Drawn in scene px. */

/* ---------- The refresh loop ---------- */

const PERIOD = 6;
const BUSY = 3.4;
const ROLL = 3.9;
const DONE = 4.6;
const STILL = 2;

type Clock = { T: number; c: number; t: number };
const clockAt = (T: number): Clock => {
  const c = Math.floor(T / PERIOD);
  return { T, c, t: T - c * PERIOD };
};
const pick = <V,>(states: V[], k: number) =>
  states[((k % states.length) + states.length) % states.length];

/* Runs while the hero is on screen; a new tab starts again from 0. With
   reduced motion it holds the streamed-in dashboard. */
export function useLoop(run: string, host: RefObject<HTMLElement | null>) {
  const [clock, setClock] = useState({ run, T: 0 });
  useEffect(() => {
    let raf = 0;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      raf = requestAnimationFrame(() => setClock({ run, T: STILL }));
      return () => cancelAnimationFrame(raf);
    }
    let visible = true;
    let last = performance.now();
    let acc = 0;
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    if (host.current) io.observe(host.current);
    const tick = (now: number) => {
      if (visible) {
        acc += Math.min(0.1, Math.max(0, (now - last) / 1000));
        setClock({ run, T: acc });
      }
      last = now;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [run, host]);
  return clock.run === run ? clock.T : 0;
}

/* Streaming, as in the homepage's Intelligent UI comparison: each block pops
   up into place when the stream reaches it, in reading order, text comes into
   focus, and bars grow one after another. */
const at = (i: number) => 0.3 + i * 0.16;
const arrive = (T: number, i: number) => pop(T, at(i));
const grow = (T: number, block: number, i = 0) => grown(T, at(block) + 0.12 + i * 0.05);
const drawn = (T: number, block: number) => ramp(T, at(block) + 0.15, at(block) + 1.1);

/* Chart data eases from one refresh to the next. */
const series = (k: Clock, states: number[][]) => {
  const p = ramp(k.t, ROLL, ROLL + 0.8);
  const a = pick(states, k.c);
  const b = pick(states, k.c + 1);
  return a.map((v, i) => lerp(v, b[i], p));
};

const spin = (a: string, b: string) => {
  const out = [a];
  for (let d = Number(a); String(d) !== b;) {
    d = (d + 1) % 10;
    out.push(String(d));
  }
  return out;
};

/* Changed digits roll up like a slot machine, one column after the next.
   Nothing blurs or fades, and nothing changes width. */
function Roll({ k, states, className }: { k: Clock; states: string[]; className?: string }) {
  const from = pick(states, k.c);
  const to = pick(states, k.c + 1);
  if (from === to || k.t < ROLL) return <span className={className}>{from}</span>;
  if (k.t >= ROLL + 1.1 || from.length !== to.length)
    return <span className={className}>{to}</span>;
  const order = [...to].map((_, i) => [...to.slice(0, i)].filter((d, j) => d !== from[j]).length);
  return (
    <span className={className}>
      {[...to].map((ch, i) => {
        const a = from[i];
        if (a === ch) return <span key={i}>{ch}</span>;
        const strip = /\d/.test(a) && /\d/.test(ch) ? spin(a, ch) : [a, ch];
        const p = ramp(k.t, ROLL + order[i] * 0.08, ROLL + 0.55 + order[i] * 0.08, easeOut);
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

const STATUS = ["Updated 1m ago", "Refreshing now", "Just refreshed"];

/* One fixed slot: the old line rolls up and out as the new one rolls in. */
function Status({ k }: { k: Clock }) {
  const i = k.t >= DONE ? 2 : k.t >= BUSY ? 1 : 0;
  const at = [0, BUSY, DONE][i];
  const prev = i > 0 ? i - 1 : k.c > 0 ? 2 : 0;
  const p = ramp(k.t, at, at + 0.35);
  const rolling = prev !== i && p < 1;
  return (
    <span className={styles.status} data-state={i}>
      <span className={styles.statusIcon} data-spin={i === 1 || undefined}>
        {i === 2 && p > 0.5 ? <Check /> : <RefreshCw />}
      </span>
      <span className={styles.statusSlot}>
        <span style={rolling ? { translate: `0 ${-p * 50}%` } : undefined}>
          {(rolling ? [prev, i] : [i]).map((s) => (
            <span key={s}>{STATUS[s]}</span>
          ))}
        </span>
      </span>
    </span>
  );
}

/* ---------- Shared pieces ---------- */

function Head({ title, k, children }: { title: string; k: Clock; children?: ReactNode }) {
  return (
    <div className={styles.head} style={arrive(k.T, 0)}>
      <span className={styles.title} style={focus(k.T, at(0))}>
        {title}
      </span>
      <span className={styles.actions}>
        <Status k={k} />
        {children}
      </span>
    </div>
  );
}

const Select = ({ label }: { label: string }) => (
  <span className={styles.select}>
    <CalendarDays />
    {label}
    <ChevronDown />
  </span>
);

const Button = ({
  icon: Icon,
  label,
  ghost,
}: {
  icon: LucideIcon;
  label?: string;
  ghost?: boolean;
}) => (
  <span className={styles.button} data-ghost={ghost || undefined} data-icon={!label || undefined}>
    <Icon />
    {label}
  </span>
);

const Delta = ({ value, down }: { value: string; down?: boolean }) => (
  <span className={styles.delta} data-down={down || undefined}>
    {down ? <TrendingDown /> : <TrendingUp />}
    {value}
  </span>
);

/* A line through a row of points, across a box W x H, values 0..max. */
const linePath = (vals: number[], W: number, H: number, max: number, x0 = 0) =>
  vals
    .map((v, i) => {
      const x = x0 + (i / (vals.length - 1)) * (W - x0);
      return `${i ? "L" : "M"}${x.toFixed(1)} ${(H - (v / max) * H).toFixed(1)}`;
    })
    .join(" ");

/* The closed region between two series, for distinct bands under each line. */
const bandPath = (top: number[], bottom: number[], W: number, H: number, max: number) =>
  `${linePath(top, W, H, max)} ${bottom
    .map((_, idx) => {
      const i = bottom.length - 1 - idx;
      const x = (i / (bottom.length - 1)) * W;
      return `L${x.toFixed(1)} ${(H - (bottom[i] / max) * H).toFixed(1)}`;
    })
    .join(" ")} Z`;

/* ---------- Sales: a dashboard page, in Studio ---------- */

const SALES_KPIS: {
  icon: LucideIcon;
  label: string;
  values: string[];
  delta: string;
  down?: boolean;
}[] = [
  { icon: Wallet, label: "Pipeline", values: ["$6.8M", "$6.9M", "$7.1M", "$7.0M"], delta: "+12%" },
  { icon: Briefcase, label: "Open deals", values: ["214", "217", "221", "219"], delta: "+6.1%" },
  { icon: Target, label: "Win rate", values: ["27%", "27%", "28%", "28%"], delta: "+2.4%" },
  {
    icon: Handshake,
    label: "Average deal",
    values: ["$31.8K", "$31.6K", "$31.9K", "$32.1K"],
    delta: "\u22121.2%",
    down: true,
  },
];
const STAGES = ["Prospecting", "Qualified", "Proposal", "Negotiation"];
const STAGE_VALUES = [
  ["$2.9M", "$2.9M", "$3.0M", "$3.0M"],
  ["$1.9M", "$2.0M", "$2.1M", "$2.0M"],
  ["$1.2M", "$1.2M", "$1.3M", "$1.3M"],
  ["$0.8M", "$0.8M", "$0.7M", "$0.7M"],
];
const SHARES = [
  [1, 0.58, 0.31, 0.14],
  [1, 0.6, 0.32, 0.15],
  [1, 0.62, 0.34, 0.15],
  [1, 0.6, 0.33, 0.16],
];
const SHARE_LABELS = [
  ["100%", "58%", "31%", "14%"],
  ["100%", "60%", "32%", "15%"],
  ["100%", "62%", "34%", "15%"],
  ["100%", "60%", "33%", "16%"],
];
const MONTHS = ["D", "J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N"];
const BOOKINGS = [
  [96, 104, 99, 112, 118, 109, 121, 127, 124, 131, 138, 142],
  [96, 104, 99, 112, 118, 109, 121, 127, 124, 131, 139, 149],
  [96, 104, 99, 112, 118, 109, 121, 127, 124, 131, 140, 156],
  [96, 104, 99, 112, 118, 109, 121, 127, 124, 131, 141, 153],
];
const REPS = [
  { name: "Maya Chen", share: ["24%", "25%", "25%", "24%"] },
  { name: "Leo Park", share: ["19%", "19%", "20%", "21%"] },
  { name: "Ana Ruiz", share: ["15%", "14%", "14%", "15%"] },
  { name: "Sam Patel", share: ["12%", "12%", "11%", "11%"] },
  { name: "Joe Kim", share: ["9%", "9%", "9%", "8%"] },
];
/* One purple, darkest to lightest, down the funnel. */
const FUNNEL = ["var(--p1)", "var(--p2)", "var(--p3)", "var(--p4)"];

function funnelBand(i: number, shares: number[], W: number, H: number) {
  const w = W / shares.length;
  const mid = H / 2;
  const half = (s: number) => Math.max(s * H, 8) / 2;
  const x0 = i * w;
  const x1 = x0 + w;
  const xc = x0 + w * 0.46;
  const a = half(shares[i]);
  const b = i + 1 < shares.length ? half(shares[i + 1]) : a;
  return `M${x0} ${mid - a} L${xc} ${mid - a} C${xc + w * 0.3} ${mid - a} ${x1 - w * 0.24} ${mid - b} ${x1} ${mid - b} L${x1} ${mid + b} C${x1 - w * 0.24} ${mid + b} ${xc + w * 0.3} ${mid + a} ${xc} ${mid + a} L${x0} ${mid + a} Z`;
}

function SalesPage({ T }: { T: number }) {
  const k = clockAt(T);
  const shares = series(k, SHARES);
  const bookings = series(k, BOOKINGS);
  const FW = 386;
  const FH = 124;
  return (
    <div className={`${styles.look} ${styles.page}`} data-look="studio">
      <Head title="Sales pipeline" k={k}>
        <Button icon={Bell} />
        <Button icon={SlidersHorizontal} label="Filters" ghost />
        <Button icon={Plus} label="New deal" />
      </Head>
      <div className={styles.kpis4}>
        {SALES_KPIS.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className={styles.card} style={arrive(T, 1 + i)}>
              <span className={styles.iconBox}>
                <Icon />
              </span>
              <span className={styles.label}>{kpi.label}</span>
              <span className={styles.valueRow}>
                <Roll k={k} states={kpi.values} className={styles.value} />
                <Delta value={kpi.delta} down={kpi.down} />
              </span>
            </div>
          );
        })}
      </div>
      <div className={styles.salesRow}>
        <div className={styles.card} style={arrive(T, 5)}>
          <span className={styles.cardTop}>
            <span className={styles.label}>Pipeline by stage</span>
            <Select label="This quarter" />
          </span>
          <span className={styles.valueRow}>
            <Roll k={k} states={SALES_KPIS[0].values} className={styles.value} />
            <Delta value="+12%" />
          </span>
          <div
            className={styles.funnel}
            style={{ clipPath: `inset(0 ${((1 - drawn(T, 5)) * 100).toFixed(2)}% 0 0)` }}
          >
            <svg viewBox={`0 0 ${FW} ${FH}`} aria-hidden="true">
              {STAGES.map((s, i) => (
                <path key={s} d={funnelBand(i, shares, FW, FH)} style={{ fill: FUNNEL[i] }} />
              ))}
            </svg>
            {STAGES.map((s, i) => (
              <span key={s} className={styles.funnelPill} style={{ left: `${(i * 100) / 4 + 9}%` }}>
                <Roll k={k} states={SHARE_LABELS.map((l) => l[i])} />
              </span>
            ))}
          </div>
          <div className={styles.tiles}>
            {STAGES.map((s, i) => (
              <span key={s} className={styles.tile}>
                <i style={{ background: FUNNEL[i] }} />
                <span>{s}</span>
                <Roll k={k} states={STAGE_VALUES[i]} className={styles.tileValue} />
              </span>
            ))}
          </div>
        </div>
        <div className={styles.card} style={arrive(T, 6)}>
          <span className={styles.cardTop}>
            <span className={styles.label}>Bookings · Forecast</span>
            <Select label="This year" />
          </span>
          <span className={styles.valueRow}>
            <Roll
              k={k}
              states={["$1.42M", "$1.49M", "$1.56M", "$1.53M"]}
              className={styles.value}
            />
            <Delta value="+9.4%" />
          </span>
          <svg className={styles.barsChart} viewBox="0 0 336 176" aria-hidden="true">
            {bookings.map((v, i) => {
              const h = (v / 170) * 156 * grow(T, 6, i);
              return (
                <rect
                  key={i}
                  x={4 + i * 27.5}
                  y={156 - h}
                  width={19}
                  height={h}
                  rx={4}
                  className={styles.bookBar}
                />
              );
            })}
            {MONTHS.map((m, i) => (
              <text key={i} className={styles.axis} x={13.5 + i * 27.5} y={173} textAnchor="middle">
                {m}
              </text>
            ))}
          </svg>
        </div>
        <div className={styles.card} style={arrive(T, 7)}>
          <span className={styles.tabs}>
            <span data-on>Reps</span>
            <span>Teams</span>
            <span>Regions</span>
          </span>
          <ul className={styles.reps}>
            {REPS.map((r, i) => {
              const share = Number(pick(r.share, k.c + (k.t >= ROLL ? 1 : 0)).replace("%", ""));
              return (
                <li key={r.name} style={pop(T, at(7) + 0.12 + i * 0.06)}>
                  <i style={{ width: `${(share / 26) * 82 * grow(T, 7, i)}%` }} />
                  {/* Initials only; the full names stay out of the chart. */}
                  <span className={styles.avatar}>
                    {r.name
                      .split(" ")
                      .map((p) => p[0])
                      .join("")}
                  </span>
                  <Roll k={k} states={r.share} className={styles.repShare} />
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      <div className={`${styles.card} ${styles.deals}`} style={arrive(T, 8)}>
        <span className={styles.cardTop}>
          <span className={styles.label}>Closing this month</span>
          <Button icon={Download} label="Export" ghost />
        </span>
        <span className={styles.th}>
          <span>Deal</span>
          <span>Owner</span>
          <span>Stage</span>
          <span>Amount</span>
        </span>
      </div>
    </div>
  );
}

/* ---------- Support: a copilot beside the dashboard, in Vivid ---------- */

const SUPPORT_KPIS: {
  icon: LucideIcon;
  label: string;
  values: string[];
  delta: string;
  tone: string;
  down?: boolean;
}[] = [
  {
    icon: Inbox,
    label: "Open tickets",
    values: ["342", "338", "331", "336"],
    delta: "9%",
    tone: "green",
  },
  {
    icon: Timer,
    label: "Within SLA",
    values: ["91%", "92%", "93%", "92%"],
    delta: "2.1%",
    tone: "blue",
  },
  {
    icon: Smile,
    label: "CSAT",
    values: ["4.6", "4.7", "4.7", "4.8"],
    delta: "0.2",
    tone: "purple",
  },
  {
    icon: Hourglass,
    label: "First reply",
    values: ["1h 48m", "1h 46m", "1h 43m", "1h 44m"],
    delta: "6%",
    tone: "orange",
    down: true,
  },
];
const RESOLVED = [
  [62, 64, 63, 66, 68, 67, 70, 72, 71, 73, 74, 76],
  [62, 64, 63, 66, 68, 67, 70, 72, 71, 73, 75, 78],
  [62, 64, 63, 66, 68, 67, 70, 72, 71, 73, 76, 80],
  [62, 64, 63, 66, 68, 67, 70, 72, 71, 73, 76, 79],
];
const AI_ONLY = [
  [41, 43, 44, 46, 49, 50, 52, 55, 57, 58, 60, 62],
  [41, 43, 44, 46, 49, 50, 52, 55, 57, 58, 61, 64],
  [41, 43, 44, 46, 49, 50, 52, 55, 57, 58, 62, 66],
  [41, 43, 44, 46, 49, 50, 52, 55, 57, 58, 62, 65],
];
const HANDOFF = [
  [24, 23, 23, 22, 21, 21, 19, 18, 18, 17, 16, 15],
  [24, 23, 23, 22, 21, 21, 19, 18, 18, 17, 15, 14],
  [24, 23, 23, 22, 21, 21, 19, 18, 18, 17, 15, 13],
  [24, 23, 23, 22, 21, 21, 19, 18, 18, 17, 15, 14],
];
const WHO = [
  [17, 5, 2],
  [17, 5, 2],
  [18, 5, 1],
  [18, 4, 2],
];
const PRIORITY = [
  { label: "Urgent", count: ["38", "36", "33", "34"], split: [52, 30, 18] },
  { label: "High", count: ["96", "94", "91", "92"], split: [64, 26, 10] },
  { label: "Medium", count: ["142", "140", "137", "139"], split: [76, 18, 6] },
];

function SupportDesk({ T }: { T: number }) {
  const k = clockAt(T);
  const resolved = series(k, RESOLVED);
  const ai = series(k, AI_ONLY);
  const handoff = series(k, HANDOFF);
  const who = pick(WHO, k.c + (k.t >= ROLL ? 1 : 0));
  const pills = who.flatMap((n, i) => Array.from({ length: n }, () => i));
  return (
    <div className={`${styles.look} ${styles.page} ${styles.left}`} data-look="vivid">
      <Head title="Support desk" k={k}>
        <span className={styles.segment}>
          <span data-on>7 days</span>
          <span>30 days</span>
          <span>90 days</span>
        </span>
      </Head>
      <div className={styles.kpis4}>
        {SUPPORT_KPIS.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className={styles.pastel}
              data-tone={kpi.tone}
              style={arrive(T, 1 + i)}
            >
              <span className={styles.pastelTop}>
                <span className={styles.chip}>
                  <Icon />
                  {kpi.label}
                </span>
                <span className={styles.link}>
                  <SquareArrowOutUpRight />
                </span>
              </span>
              <Roll k={k} states={kpi.values} className={styles.mono} />
              <span className={styles.pastelFoot}>
                <Delta value={kpi.delta} down={kpi.down} />
                vs last week
              </span>
            </div>
          );
        })}
      </div>
      <div className={styles.supportRow}>
        <div className={styles.card} style={arrive(T, 4)}>
          <span className={styles.cardTop}>
            <span className={styles.cardTitle}>Resolution over time</span>
            <span className={styles.legend}>
              <i data-c="green" /> Overall <i data-c="blue" /> AI only <i data-c="ink" /> Handoff
            </span>
          </span>
          <svg className={styles.lines} viewBox="0 0 440 178" aria-hidden="true">
            <rect className={styles.panel} x="0" y="0" width="440" height="178" rx="10" />
            {[25, 50, 75].map((v) => (
              <line
                key={v}
                className={styles.gridLine}
                x1="34"
                x2="430"
                y1={168 - (v / 100) * 150}
                y2={168 - (v / 100) * 150}
              />
            ))}
            {[0, 25, 50, 75, 100].map((v) => (
              <text key={v} className={styles.axis} x="8" y={172 - (v / 100) * 150}>
                {v}%
              </text>
            ))}
            <g transform="translate(34 18)">
              {/* Three distinct bands: overall over AI, AI over handoff, and
                  handoff down to the axis, each in its line's colour. */}
              <path
                className={`${styles.area} ${styles.areaGreen}`}
                d={bandPath(resolved, ai, 396, 150, 100)}
                style={{ opacity: 0.07 * drawn(T, 4) }}
              />
              <path
                className={`${styles.area} ${styles.areaBlue}`}
                d={bandPath(ai, handoff, 396, 150, 100)}
                style={{ opacity: 0.07 * drawn(T, 4) }}
              />
              <path
                className={`${styles.area} ${styles.areaInk}`}
                d={`${linePath(handoff, 396, 150, 100)} L396 150 L0 150 Z`}
                style={{ opacity: 0.05 * drawn(T, 4) }}
              />
              {(
                [
                  [styles.lineGreen, resolved],
                  [styles.lineBlue, ai],
                  [styles.lineInk, handoff],
                ] as const
              ).map(([cls, vals]) => (
                <path
                  key={cls}
                  className={cls}
                  d={linePath(vals, 396, 150, 100)}
                  pathLength={1}
                  strokeDasharray={`${drawn(T, 4)} 1`}
                />
              ))}
              <circle
                className={styles.dotGreen}
                cx="396"
                cy={150 - (resolved[11] / 100) * 150}
                r="4.5"
              />
              <circle className={styles.dotBlue} cx="396" cy={150 - (ai[11] / 100) * 150} r="4.5" />
            </g>
          </svg>
        </div>
        <div className={styles.card} style={arrive(T, 5)}>
          <span className={styles.cardTitle}>Who resolves</span>
          <span className={styles.pills}>
            {pills.map((c, i) => (
              <i key={i} data-c={c} style={pop(T, at(5) + 0.12 + i * 0.025)} />
            ))}
          </span>
          <span className={styles.stats}>
            <span>
              <b>
                <i data-c={0} /> AI resolved
              </b>
              <Roll
                k={k}
                states={["72.4%", "72.9%", "74.1%", "73.6%"]}
                className={styles.statValue}
              />
            </span>
            <span>
              <b>
                <i data-c={1} /> Human
              </b>
              <Roll
                k={k}
                states={["22.2%", "21.9%", "21.2%", "21.5%"]}
                className={styles.statValue}
              />
            </span>
            <span>
              <b>
                <i data-c={2} /> Unresolved
              </b>
              <Roll k={k} states={["5.4%", "5.2%", "4.7%", "4.9%"]} className={styles.statValue} />
            </span>
          </span>
        </div>
      </div>
      <div className={styles.card} style={arrive(T, 6)}>
        <span className={styles.cardTop}>
          <span className={styles.cardTitle}>Tickets by priority</span>
          <span className={styles.legend}>
            <i data-c="green" /> Resolved <i data-c="orange" /> Handoff <i data-c="red" /> Open
          </span>
        </span>
        <div className={styles.rows}>
          {PRIORITY.map((p, i) => (
            <span key={p.label} className={styles.row} style={pop(T, at(6) + 0.12 + i * 0.08)}>
              <span className={styles.rowName}>{p.label}</span>
              <span className={styles.split} style={{ scale: `${grow(T, 6, i + 2).toFixed(4)} 1` }}>
                {p.split.map((v, i) => (
                  <i key={i} data-c={["green", "orange", "red"][i]} style={{ flexGrow: v }} />
                ))}
              </span>
              <Roll k={k} states={p.count} className={styles.rowCount} />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- Finance: an answer in chat, in the overview's light grid ---------- */

const FIN_KPIS: {
  icon: LucideIcon;
  label: string;
  values: string[];
  delta: string;
  note: string;
  color: string;
}[] = [
  {
    icon: Landmark,
    label: "Revenue",
    values: ["$1.24M", "$1.25M", "$1.27M", "$1.26M"],
    delta: "+8.1%",
    note: "Quarter to date",
    color: "#fb923c",
  },
  {
    icon: Receipt,
    label: "Operating spend",
    values: ["$812K", "$815K", "$819K", "$822K"],
    delta: "4.0% under",
    note: "Against budget",
    color: "#f97316",
  },
  {
    icon: PiggyBank,
    label: "Gross margin",
    values: ["62.4%", "62.6%", "62.9%", "62.7%"],
    delta: "+1.2 pt",
    note: "Up from Q3",
    color: "#ea580c",
  },
  {
    icon: Wallet,
    label: "Runway",
    values: ["22 mo", "22 mo", "23 mo", "23 mo"],
    delta: "+2 mo",
    note: "At current burn",
    color: "#c2410c",
  },
];
const WEEKS = 26;
const cash = (seed: number) =>
  Array.from(
    { length: WEEKS },
    (_, w) => 5.2 + Math.sin(w * 0.9 + seed) * 1.3 + Math.sin(w * 0.37) * 1.1 + w * 0.06,
  );
const CASH_IN = [cash(0), cash(0.3), cash(0.6), cash(0.9)];
const CASH_OUT = CASH_IN.map((a) => a.map((v, w) => v * 0.55 + Math.sin(w * 1.3) * 0.4));
const DEPTS = [
  { label: "Engineering", actual: [412, 413, 415, 414], budget: 430, color: "#fb923c" },
  { label: "Sales", actual: [238, 240, 243, 245], budget: 252, color: "#f97316" },
  { label: "Marketing", actual: [162, 162, 161, 163], budget: 176, color: "#dc2626" },
];
const usdK = (n: number) => `$${Math.round(n)}K`;

function FinanceBoard({ T }: { T: number }) {
  const k = clockAt(T);
  const inn = series(k, CASH_IN);
  const out = series(k, CASH_OUT);
  const actual = series(
    k,
    [0, 1, 2, 3].map((s) => DEPTS.map((d) => d.actual[s])),
  );
  const ROWS = 9;
  return (
    <div className={`${styles.look} ${styles.board}`} data-look="grid">
      <Head title="Q4 budget" k={k}>
        <Select label="This quarter" />
        <Button icon={Download} label="Export" ghost />
      </Head>
      <div className={styles.gridKpis}>
        {FIN_KPIS.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className={styles.gridKpi} style={arrive(T, 1 + i)}>
              <span className={styles.gridTop}>
                <span className={styles.square} style={{ background: kpi.color }}>
                  <Icon />
                </span>
                <span className={styles.gridLabel}>{kpi.label}</span>
                <Ellipsis className={styles.more} />
              </span>
              <span className={styles.gridValue}>
                <Roll k={k} states={kpi.values} className={styles.value} />
                <Delta value={kpi.delta} />
              </span>
              <span className={styles.gridNote}>{kpi.note}</span>
            </div>
          );
        })}
      </div>
      <div className={styles.gridRow}>
        <div className={styles.gridCell} style={arrive(T, 5)}>
          <span className={styles.cardTop}>
            <span className={styles.cardTitle}>Cash flow</span>
            <span className={styles.legend}>
              <i data-c="in" /> Cash in <i data-c="out" /> Cash out
            </span>
          </span>
          <svg className={styles.cells} viewBox="0 0 640 178" aria-hidden="true">
            {inn.map((v, w) =>
              Array.from(
                { length: T >= at(5) + 0.12 + w * 0.03 ? Math.min(ROWS, Math.round(v + 1)) : 0 },
                (_, r) => (
                  <rect
                    key={`${w}-${r}`}
                    x={w * 24.6}
                    y={158 - (r + 1) * 17.4}
                    width={20.6}
                    height={14}
                    rx={2.5}
                    data-c={r < Math.round(out[w]) ? "out" : r < Math.round(v) ? "in" : undefined}
                  />
                ),
              ),
            )}
            {["Aug", "Sep", "Oct", "Nov"].map((m, i) => (
              <text key={m} className={styles.axis} x={i * 172 + 40} y={176} textAnchor="middle">
                {m}
              </text>
            ))}
          </svg>
        </div>
        <div className={styles.gridCell} style={arrive(T, 6)}>
          <span className={styles.cardTop}>
            <span className={styles.cardTitle}>Budget vs actual</span>
            <span className={styles.trend}>
              <TrendingDown />
              4.0%
            </span>
          </span>
          <span className={styles.hatched}>
            {DEPTS.map((d, i) => (
              <span key={d.label}>
                <i>
                  <b
                    style={{
                      height: `${(actual[i] / 460) * 100 * grow(T, 6, i * 2)}%`,
                      background: d.color,
                    }}
                  />
                </i>
                <i>
                  <b
                    data-budget
                    style={{ height: `${(d.budget / 460) * 100 * grow(T, 6, i * 2 + 1)}%` }}
                  />
                </i>
              </span>
            ))}
          </span>
          <ul className={styles.list}>
            {DEPTS.map((d) => (
              <li key={d.label}>
                <i style={{ background: d.color }} />
                <span>{d.label}</span>
                <Roll k={k} states={d.actual.map(usdK)} className={styles.listValue} />
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className={styles.invoices} style={arrive(T, 7)}>
        <span className={styles.cardTitle}>Recent invoices</span>
        <span className={styles.th}>
          <span>Vendor</span>
          <span>Due</span>
          <span>Amount</span>
          <span>Status</span>
        </span>
      </div>
    </div>
  );
}

/* ---------- Logistics: a phone app, in Studio ---------- */

const LOG_KPIS: {
  icon: LucideIcon;
  label: string;
  values: string[];
  delta: string;
  down?: boolean;
}[] = [
  {
    icon: PackageCheck,
    label: "Delivered",
    values: ["1,284", "1,291", "1,303", "1,316"],
    delta: "+4%",
  },
  { icon: Timer, label: "On time", values: ["96%", "96%", "97%", "97%"], delta: "+1.2%" },
  { icon: Truck, label: "In transit", values: ["212", "205", "197", "190"], delta: "+8" },
  {
    icon: TriangleAlert,
    label: "Delayed",
    values: ["18", "17", "15", "16"],
    delta: "+3",
    down: true,
  },
];
const REGIONS = [
  { label: "North", values: ["82%", "83%", "84%", "84%"] },
  { label: "South", values: ["74%", "75%", "75%", "77%"] },
  { label: "East", values: ["66%", "66%", "68%", "69%"] },
  { label: "West", values: ["48%", "51%", "53%", "52%"] },
];
const SHIPMENTS = [
  { route: "Oakland to Reno", eta: "2:40 pm", late: false },
  { route: "Fresno to San Jose", eta: "3:15 pm", late: true },
];

function DeliveriesApp({ T }: { T: number }) {
  const k = clockAt(T);
  const step = k.c + (k.t >= ROLL ? 1 : 0);
  return (
    <div className={`${styles.look} ${styles.mobile}`} data-look="studio">
      <span className={styles.bar}>
        <b>9:41</b>
        <span>
          <Signal />
          <Wifi />
          <BatteryFull />
        </span>
      </span>
      <div className={styles.mobileHead} style={arrive(T, 0)}>
        <span className={styles.title}>Deliveries</span>
        <Status k={k} />
      </div>
      <div className={styles.kpis2}>
        {LOG_KPIS.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className={styles.card} style={arrive(T, 1 + i)}>
              <span className={styles.iconBox}>
                <Icon />
              </span>
              <span className={styles.label}>{kpi.label}</span>
              <span className={styles.valueRow}>
                <Roll k={k} states={kpi.values} className={styles.value} />
                <Delta value={kpi.delta} down={kpi.down} />
              </span>
            </div>
          );
        })}
      </div>
      <div className={styles.card} style={arrive(T, 5)}>
        <span className={styles.cardTop}>
          <span className={styles.label}>On time by region</span>
          <Select label="Today" />
        </span>
        <ul className={styles.reps} data-compact>
          {REGIONS.map((r, i) => {
            const v = Number(pick(r.values, step).replace("%", ""));
            const from = Number(pick(r.values, k.c).replace("%", ""));
            const w = lerp(from, v, ramp(k.t, ROLL, ROLL + 0.8));
            return (
              <li key={r.label} style={pop(T, at(5) + 0.12 + i * 0.06)}>
                <i style={{ width: `${w * 0.86 * grow(T, 5, i)}%` }} />
                <span className={styles.repName}>{r.label}</span>
                <Roll k={k} states={r.values} className={styles.repShare} />
              </li>
            );
          })}
        </ul>
      </div>
      <div className={styles.card} style={arrive(T, 6)}>
        <span className={styles.label}>Live shipments</span>
        {SHIPMENTS.map((s) => (
          <span key={s.route} className={styles.shipment}>
            <span>
              <b>{s.route}</b>
              <em>ETA {s.eta}</em>
            </span>
            <span className={styles.badge} data-late={s.late || undefined}>
              {s.late ? "Delayed" : "On time"}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

export const SCENES = {
  sales: SalesPage,
  support: SupportDesk,
  finance: FinanceBoard,
  logistics: DeliveriesApp,
};

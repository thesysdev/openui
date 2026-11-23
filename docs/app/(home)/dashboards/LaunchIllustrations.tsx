"use client";

import {
  ArrowUp,
  Check,
  Database,
  FileCode2,
  Layers3,
  LoaderCircle,
  Sparkles,
  UserRoundPlus,
} from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
  type Ref,
} from "react";
import WIDGETS from "./launch-widgets.json";
import s from "./LaunchIllustrations.module.css";

/*
 * The two launch scenes. Each is a 588-wide scene scaled to its card, built
 * around one real widget at a time: Card, SegmentedBar, Donut and TimeSeries
 * from @openuidev/dashboard-library, captured from the library in both themes
 * (launch-widgets.json holds their sizes and the weekly card's part geometry).
 * A looping timeline says which step is on; CSS does the motion.
 */

const ASSETS = "/dashboards/launch";
const THEMES = ["light", "dark"] as const;

/** Each source's mark: PostHog's own full-colour logo (one per theme), or a one-colour mask. */
const SOURCES: Record<
  "posthog" | "postgres",
  { name: string; logo?: string; mask?: string; color?: string }
> = {
  posthog: { name: "PostHog", logo: "posthog" },
  postgres: {
    name: "PostgreSQL",
    mask: 'url("/integration-logos/postgresql.svg")',
    color: "#2f6feb",
  },
};
type Source = keyof typeof SOURCES;

/* ---------- Timeline ---------- */

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribeToMotion(onChange: () => void) {
  const media = window.matchMedia(REDUCED_MOTION);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

/**
 * Steps through `durations` (ms each) and wraps, only while the scene is on
 * screen. Reduced motion rests on `still`.
 */
function Scene({
  durations,
  still,
  children,
}: {
  durations: readonly number[];
  still: number;
  children: (step: number) => ReactNode;
}) {
  const view = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const [inView, setInView] = useState(false);
  const reduced = useSyncExternalStore(
    subscribeToMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  );
  const playing = inView && !reduced;

  useEffect(() => {
    const node = view.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.35,
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(
      () => setStep((current) => (current + 1) % durations.length),
      durations[step],
    );
    return () => window.clearTimeout(timer);
  }, [playing, step, durations]);

  return (
    <div ref={view} className={s.root} data-playing={playing || undefined}>
      <div className={s.scene} aria-hidden="true">
        {children(reduced ? still : step)}
      </div>
    </div>
  );
}

/* ---------- Shared parts ---------- */

/** A captured widget, in each theme the page has; CSS shows the one for the current theme. */
function Shot({ name }: { name: string }) {
  return THEMES.map((theme) => (
    // eslint-disable-next-line @next/next/no-img-element -- static captures, shown at their own size
    <img
      key={theme}
      className={s.shot}
      data-theme-shot={theme}
      src={`${ASSETS}/${name}-${theme}.png`}
      alt=""
      draggable={false}
    />
  ));
}

function SourceMark({ source }: { source: Source }) {
  const { logo, mask, color } = SOURCES[source];
  if (logo) {
    return THEMES.map((theme) => (
      // eslint-disable-next-line @next/next/no-img-element -- a small static logo
      <img
        key={theme}
        className={s.logo}
        data-theme-shot={theme}
        src={`${ASSETS}/${logo}-${theme}.svg`}
        alt=""
        draggable={false}
      />
    ));
  }
  return (
    <i className={s.mark} style={{ "--mark": mask, "--mark-color": color } as CSSProperties} />
  );
}

/** The laid-out width of a label, so a button can be sized to it and still morph. */
function useWidth(fallback: number) {
  const ref = useRef<HTMLSpanElement>(null);
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.ceil(entry.borderBoxSize[0].inlineSize)),
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

/** A point in the scene, from its horizontal centre and its vertical centre (which phones move down). */
type Point = { x: number; y: number };
const at = ({ x, y }: Point, offset = 0) =>
  `calc(294px + ${x - offset}px) calc(var(--cy) + ${y - offset}px)`;

const POINTER =
  "M4.037 4.688a.495.495 0 0 1 .651-.651l16 6.5a.5.5 0 0 1-.063.947l-6.124 1.58a2 2 0 0 0-1.438 1.435l-1.579 6.126a.5.5 0 0 1-.947.063z";

/** The viewer's own pointer, its tip on `to`. */
function Cursor({
  to,
  on = true,
  click = false,
  travel = 700,
}: {
  to: Point;
  on?: boolean;
  click?: boolean;
  travel?: number;
}) {
  return (
    <span
      className={s.cursor}
      data-on={on || undefined}
      style={{ translate: at(to), "--travel": `${travel}ms` } as CSSProperties}
    >
      <svg viewBox="0 0 24 24" data-click={click || undefined}>
        <path d={POINTER} />
      </svg>
    </span>
  );
}

/* ---------- Sharing and live editing ---------- */

/*
 * A collaborator is one shape that is an avatar and then their pointer. The circle, a small dot
 * and the arrow are each the same number of points around their outline, so clip-path can go
 * from one to the next while it moves: the avatar draws in to a dot, and the dot sharpens into
 * the arrow. The avatar's centre and the arrow's tip are the same point. The white edge is the
 * same shapes grown by EDGE, behind the colour: no filters, so no shadow or box around it.
 */
const MORPH_BOX = 80;
const MID = MORPH_BOX / 2;
const MORPH_POINTS = 40;
type XY = [number, number];

const circle = (r: number, [cx, cy]: XY = [MID, MID]): XY[] =>
  Array.from({ length: MORPH_POINTS }, (_, i) => {
    const a = ((-135 + (360 * i) / MORPH_POINTS) * Math.PI) / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  });

/** MORPH_POINTS points spaced evenly around a closed outline, from its first corner. */
const around = (outline: XY[]): XY[] => {
  const sides = outline.map((p, i) => [p, outline[(i + 1) % outline.length]] as const);
  const lengths = sides.map(([a, b]) => Math.hypot(b[0] - a[0], b[1] - a[1]));
  const total = lengths.reduce((sum, l) => sum + l, 0);
  return Array.from({ length: MORPH_POINTS }, (_, i) => {
    let d = (total * i) / MORPH_POINTS;
    let k = 0;
    while (d > lengths[k]) d -= lengths[k++];
    const [a, b] = sides[k];
    const t = d / lengths[k];
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  });
};

/** The pointer's outline (lucide's mouse-pointer-2), its tip at the middle of the box. */
const ARROW: XY[] = [
  [0, 0],
  [16.35, 6.7],
  [9.5, 9.5],
  [6.7, 16.35],
].map(([x, y]) => [MID + x * 1.3, MID + y * 1.3]);

/** An outline grown by `d` on every side, its sharp corners rounded; it starts at the tip. */
const grow = (outline: XY[], d: number): XY[] => {
  const unit = ([x, y]: XY): XY => [x / Math.hypot(x, y), y / Math.hypot(x, y)];
  const normal = (a: XY, b: XY) => unit([b[1] - a[1], a[0] - b[0]]);
  const grown = outline.flatMap((p, i): XY[] => {
    const n1 = normal(outline[(i - 1 + outline.length) % outline.length], p);
    const n2 = normal(p, outline[(i + 1) % outline.length]);
    const cos = n1[0] * n2[0] + n1[1] * n2[1];
    if (cos > 0.5) {
      const k = d / (1 + cos);
      return [[p[0] + (n1[0] + n2[0]) * k, p[1] + (n1[1] + n2[1]) * k]];
    }
    const mid = unit([n1[0] + n2[0], n1[1] + n2[1]]);
    return [n1, mid, n2].map(([x, y]): XY => [p[0] + x * d, p[1] + y * d]);
  });
  return [...grown.slice(1), grown[0]];
};

const polygon = (points: XY[]) =>
  `polygon(${points.map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`).join(", ")})`;
const EDGE = 1.75;
const DOT: XY = [MID + 9.5, MID + 9.5];
const SHAPES = {
  avatar: { fill: polygon(circle(28)), edge: polygon(circle(28 + EDGE)) },
  dot: { fill: polygon(circle(8.5, DOT)), edge: polygon(circle(8.5 + EDGE, DOT)) },
  arrow: { fill: polygon(around(ARROW)), edge: polygon(around(grow(ARROW, EDGE))) },
};

function Collaborator({
  initial,
  tone,
  to,
  shape,
  on,
  instant = false,
  click = false,
  travel,
  delay = 0,
  children,
}: {
  initial: string;
  tone: string;
  to: Point;
  shape: keyof typeof SHAPES;
  on: boolean;
  instant?: boolean;
  click?: boolean;
  travel: number;
  delay?: number;
  children?: ReactNode;
}) {
  return (
    <span
      className={s.collaborator}
      data-on={on || undefined}
      data-instant={instant || undefined}
      data-shape={shape}
      style={
        {
          translate: at(to, MID),
          "--tone": tone,
          "--travel": `${travel}ms`,
          "--delay": `${delay}ms`,
        } as CSSProperties
      }
    >
      <span className={s.collaboratorBody} data-click={click || undefined}>
        <span className={s.collaboratorEdge} style={{ clipPath: SHAPES[shape].edge }} />
        <span className={s.collaboratorShape} style={{ clipPath: SHAPES[shape].fill }} />
      </span>
      <span className={s.collaboratorInitial}>{initial}</span>
      {children}
    </span>
  );
}

const EDITORS = [
  { initial: "M", tone: "#ba625c" },
  { initial: "J", tone: "#6357e0" },
  { initial: "A", tone: "#d62ee8" },
] as const;

/** Share's padding: x above, below and on the icon's side, 1.5x on the text's side. */
const SHARE_PAD = 16;
const SHARE_H = 56;

function ShareLabel({ measure }: { measure?: Ref<HTMLSpanElement> }) {
  return (
    <span ref={measure} className={s.shareLabel}>
      <UserRoundPlus />
      Share
    </span>
  );
}

const { channel: CHANNEL } = WIDGETS;
/** The widget is zoomed in on as a bar, and out a little once it's the taller half donut. */
const ZOOM = { bar: 1.06, pie: 0.84 };
/** A point on the card (card px) in the scene, for the bar or the pie. */
const onCard = (x: number, y: number, pie: boolean): Point => {
  const z = pie ? ZOOM.pie : ZOOM.bar;
  const h = (pie ? CHANNEL.pieTop : CHANNEL.barTop) + CHANNEL.legend;
  return { x: (x - CHANNEL.w / 2) * z, y: (y - h / 2) * z };
};

/** Where each collaborator's pointer rests, beside the bar and then beside the half donut. */
const REST = [
  { bar: onCard(-14, 196, false), pie: onCard(-14, 300, true) },
  { bar: onCard(316, 40, false), pie: onCard(318, 60, true) },
  { bar: onCard(214, 236, false), pie: onCard(236, 118, true) },
];
const BAR_AT = onCard(150, 78, false);
const AVATAR_GAP = 50;
const ASK = "Show this as a donut";

/* 0 rest, 1 to Share, 2 click, 3 Share becomes the editors' avatars, 4 the avatars fly out,
   drawing in to dots, while the widget rises in, 5 the dots sharpen into pointers as they land,
   6 one heads for the bar, 7 selects it, 8 types the ask, 9 sends it, 10 it's a donut, 11 hold,
   12 the card closes into Share. */
const SHARE_STEPS = [700, 750, 300, 1150, 470, 730, 700, 350, 1250, 400, 1000, 1700, 1150] as const;

export function SharingIllustration() {
  return (
    <Scene durations={SHARE_STEPS} still={11}>
      {(step) => <Sharing step={step} />}
    </Scene>
  );
}

function Sharing({ step }: { step: number }) {
  const [label, labelWidth] = useWidth(84);
  const share = step <= 2 ? "button" : step === 3 ? "avatar" : "gone";
  const widget = step === 12 ? "button" : step >= 4 ? "on" : "off";
  const joined = step >= 4 && step <= 11;
  const pie = step >= 10;
  const owner =
    step === 1 || step === 2 ? { x: 10, y: 8 } : step === 3 ? { x: 40, y: 70 } : { x: 132, y: 92 };
  const button = {
    "--share-w": `${labelWidth + SHARE_PAD * 2.5}px`,
    "--share-h": `${SHARE_H}px`,
    "--share-pad": `${SHARE_PAD}px`,
  };

  return (
    <>
      <span
        className={s.shareButton}
        data-state={share}
        data-pressed={step === 2 || undefined}
        style={{ ...button, "--tone": EDITORS[1].tone } as CSSProperties}
      >
        <ShareLabel measure={label} />
        <span className={s.shareInitial}>{EDITORS[1].initial}</span>
      </span>

      <div
        className={s.widget}
        data-state={widget}
        data-pie={pie || undefined}
        data-selected={(step >= 7 && step <= 11) || undefined}
        style={
          {
            ...button,
            "--z": pie ? ZOOM.pie : ZOOM.bar,
            "--glow": EDITORS[2].tone,
            "--card-w": `${CHANNEL.w}px`,
            "--bar-h": `${CHANNEL.barTop}px`,
            "--pie-h": `${CHANNEL.pieTop}px`,
            "--legend-h": `${CHANNEL.legend}px`,
          } as CSSProperties
        }
      >
        <div className={s.widgetContent}>
          <div className={s.widgetChart}>
            <div className={s.chartLayer} data-on={!pie || undefined}>
              <Shot name="bar-top" />
            </div>
            <div className={s.chartLayer} data-on={pie || undefined}>
              <Shot name="pie-top" />
            </div>
          </div>
          <Shot name="legend" />
        </div>
        <span className={s.widgetFace}>
          <ShareLabel />
        </span>
      </div>

      <Cursor to={owner} on={step <= 2} click={step === 2} travel={step === 3 ? 600 : 800} />
      {EDITORS.map((e, i) => {
        const side = i - 1;
        let to: Point = { x: step === 3 ? side * AVATAR_GAP : 0, y: 0 };
        if (step >= 4) to = pie ? REST[i].pie : REST[i].bar;
        if (i === 2 && step >= 6 && step <= 9) to = BAR_AT;
        const middle = i === 1;
        return (
          <Collaborator
            key={e.initial}
            initial={e.initial}
            tone={e.tone}
            to={to}
            shape={step >= 5 ? "arrow" : step === 4 ? "dot" : "avatar"}
            on={joined || (step === 3 && !middle)}
            instant={middle && step <= 4}
            click={i === 2 && step === 7}
            travel={step === 3 ? 760 : step === 4 || step === 5 ? 1050 : step === 10 ? 800 : 700}
            delay={step === 3 ? 420 : 0}
          >
            {i === 2 && (
              <span className={s.chat} data-open={(step >= 8 && step <= 9) || undefined}>
                <span
                  className={s.chatText}
                  data-typed={(step >= 8 && step <= 10) || undefined}
                  style={{ "--chars": ASK.length } as CSSProperties}
                >
                  {ASK}
                </span>
                <i data-sent={step === 9 || undefined}>
                  <ArrowUp />
                </i>
              </span>
            )}
          </Collaborator>
        );
      })}
    </>
  );
}

/* ---------- Probing and Sources ---------- */

/** The build's tool calls, as the dashboard's own build feed lists them. */
const PROBES: { icon: ReactNode; label: string; source?: Source }[] = [
  { icon: <Database />, label: "Querying signups", source: "posthog" },
  { icon: <Database />, label: "Querying paid orders", source: "postgres" },
  { icon: <FileCode2 />, label: "Preparing paid conversions by week" },
];

/**
 * The build feed: a headline with its running time, then one row per tool call as it happens.
 * When the build is written, the same box resizes to the chart's card and becomes its skeleton.
 */
function Feed({
  state,
  step,
  skeleton,
}: {
  state: "on" | "skeleton" | "off";
  step: number;
  skeleton: { w: number; h: number; top: number };
}) {
  const shown = Math.min(step, PROBES.length - 1) + 1;
  const headline = step < PROBES.length ? "Querying your data" : "Writing the dashboard";
  return (
    <div
      className={s.feed}
      data-state={state}
      style={
        {
          "--rows": shown,
          "--skeleton-w": `${skeleton.w}px`,
          "--skeleton-h": `${skeleton.h}px`,
          "--skeleton-top": `${skeleton.top}px`,
        } as CSSProperties
      }
    >
      <div className={s.feedHeader}>
        <Sparkles />
        <span key={headline} className={s.feedHeadline} data-on={state === "on" || undefined}>
          {headline}
        </span>
        <span className={s.feedElapsed}>0:0{Math.min(step, PROBES.length) + 1}</span>
      </div>
      <ol>
        {PROBES.slice(0, shown).map((probe, i) => {
          const active = i === step;
          return (
            <li key={probe.label} className={s.feedRow} data-state={active ? "active" : "done"}>
              <span className={s.feedTile}>{probe.icon}</span>
              <span className={s.feedLabel}>{probe.label}</span>
              {probe.source && (
                <span className={s.chip}>
                  <SourceMark source={probe.source} />
                  {SOURCES[probe.source].name}
                </span>
              )}
              <span className={s.feedStatus}>
                {active ? <LoaderCircle className={s.spinner} /> : <Check />}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

const { weeks: WEEKS } = WIDGETS;
const rounded = (x: number, y: number, w: number, h: number, r: number) => {
  const q = Math.min(r, w / 2, h / 2);
  return `M${x + q} ${y}H${x + w - q}A${q} ${q} 0 0 1 ${x + w} ${y + q}V${y + h - q}A${q} ${q} 0 0 1 ${x + w - q} ${y + h}H${x + q}A${q} ${q} 0 0 1 ${x} ${y + h - q}V${y + q}A${q} ${q} 0 0 1 ${x + q} ${y}Z`;
};

/** The chart's outline and parts, from its real layout, drawn top to bottom in under a second. */
const DRAFT = [
  { d: rounded(0.5, 0.5, WEEKS.w - 1, WEEKS.h - 1, 16), delay: 150, duration: 650 },
  ...[...WEEKS.parts]
    .sort((a, b) => a.y - b.y || a.x - b.x)
    .map((p, i) => ({
      d:
        p.kind === "text"
          ? `M${p.x} ${p.y + p.h * 0.56}H${p.x + p.w}`
          : "line" in p
            ? `M${p.x} ${p.y}H${p.x + p.w}`
            : rounded(p.x, p.y, p.w, p.h, p.r ?? 0),
      delay: 260 + i * 16,
      duration: 340,
    })),
];

/** The chart drawn in dots, line by line, before it becomes the card. */
function Draft({ on }: { on: boolean }) {
  const mask = `draft-${useId().replace(/:/g, "")}`;
  return (
    <svg
      className={s.draft}
      data-on={on || undefined}
      viewBox={`0 0 ${WEEKS.w} ${WEEKS.h}`}
      width={WEEKS.w}
      height={WEEKS.h}
    >
      <mask
        id={mask}
        maskUnits="userSpaceOnUse"
        x={-8}
        y={-8}
        width={WEEKS.w + 16}
        height={WEEKS.h + 16}
      >
        {DRAFT.map((p, i) => (
          <path
            key={i}
            d={p.d}
            pathLength={1}
            className={s.draftReveal}
            style={{ "--delay": `${p.delay}ms`, "--duration": `${p.duration}ms` } as CSSProperties}
          />
        ))}
      </mask>
      <g mask={`url(#${mask})`}>
        {DRAFT.map((p, i) => (
          <path key={i} d={p.d} className={s.draftDots} />
        ))}
      </g>
    </svg>
  );
}

/** Each source of the chart as the Sources panel lists it: what it is, and the call that read it. */
const CHART_SOURCES: { source: Source; name: string; call: string }[] = [
  { source: "posthog", name: "Signups", call: "posthog_query · events" },
  { source: "postgres", name: "Paid orders", call: "postgres_query · orders" },
];

/* The chart in focus while it's drawn and clicked; its Sources button sits under it. Clicked,
   the button grows into the panel in the middle of the card, and the chart moves up and away. */
const CHART_FOCUS = { y: -16, z: 0.82 };
const CHART_AWAY = { y: -120, z: 0.8 };
const PANEL = { w: 340, h: 176 };
/** The feed's box, resized to the chart's card in focus, where the skeleton is drawn. */
const SKELETON = {
  w: WEEKS.w * CHART_FOCUS.z,
  h: WEEKS.h * CHART_FOCUS.z,
  top: CHART_FOCUS.y - (WEEKS.h * CHART_FOCUS.z) / 2,
};
const PILL = { h: 36, pad: 12, top: CHART_FOCUS.y + (WEEKS.h * CHART_FOCUS.z) / 2 + 12 };
/** The bar the pointer clicks (Nov 10), and the Sources button under the chart. */
const BAR_TIP: Point = {
  x: (270 - WEEKS.w / 2) * CHART_FOCUS.z,
  y: CHART_FOCUS.y + (178 - WEEKS.h / 2) * CHART_FOCUS.z,
};
const PILL_TIP: Point = { x: 14, y: PILL.top + PILL.h / 2 + 2 };

/* 0–2 the feed: one tool call after another, 3 writing the dashboard, 4 the feed's box resizes
   to the chart's card and the chart is drawn in it, 5 it becomes the card, 6 the pointer goes to a bar, 7 click: the chart is selected and its
   Sources button shows, 8 to the button, 9 click: the button grows into Sources and the chart
   moves up and away, 10 hold, 11 Sources closes into the build feed, which starts again. */
const BUILD_STEPS = [900, 1000, 1000, 900, 1000, 900, 800, 700, 650, 900, 2200, 850] as const;

export function SourcesIllustration() {
  return (
    <Scene durations={BUILD_STEPS} still={10}>
      {(step) => <Build step={step} />}
    </Scene>
  );
}

function Build({ step }: { step: number }) {
  const [pillLabel, pillLabelWidth] = useWidth(72);
  const chart = step === 4 ? "draft" : step >= 5 && step <= 10 ? "card" : "hidden";
  const open = step >= 9 && step <= 10;
  const place = open ? CHART_AWAY : CHART_FOCUS;
  const sources =
    step === 7 || step === 8 ? "button" : open ? "panel" : step === 11 ? "feed" : "hidden";
  const pointer = step === 6 || step === 7 ? BAR_TIP : step >= 8 ? PILL_TIP : { x: 150, y: 150 };

  return (
    <>
      <Feed
        state={step <= 3 ? "on" : step <= 5 ? "skeleton" : "off"}
        step={step === 11 ? 0 : Math.min(step, PROBES.length)}
        skeleton={SKELETON}
      />

      <div
        className={s.chart}
        data-state={chart}
        data-selected={(step >= 7 && step <= 8) || undefined}
        data-open={open || undefined}
        style={{ transform: `translateY(${place.y}px) scale(${place.z})` }}
      >
        <div className={s.chartCard} style={{ width: WEEKS.w, height: WEEKS.h }}>
          <Shot name="weeks" />
        </div>
        <Draft on={step === 4 || step === 5} />
      </div>

      <div
        className={s.sources}
        data-state={sources}
        data-pressed={step === 9 || undefined}
        style={
          {
            "--pill-w": `${pillLabelWidth + PILL.pad * 2.5}px`,
            "--pill-h": `${PILL.h}px`,
            "--pill-pad": `${PILL.pad}px`,
            "--pill-top": `${PILL.top}px`,
            "--panel-w": `${PANEL.w}px`,
            "--panel-h": `${PANEL.h}px`,
          } as CSSProperties
        }
      >
        <span ref={pillLabel} className={s.sourcesButton}>
          <Layers3 /> Sources
        </span>
        <span className={s.sourcesPanel}>
          <span className={s.sourcesHead}>
            <Layers3 /> Sources
          </span>
          {CHART_SOURCES.map((item) => (
            <span key={item.name} className={s.sourceRow}>
              <span className={s.sourceTile}>
                <SourceMark source={item.source} />
              </span>
              <span className={s.sourceText}>
                <span>{item.name}</span>
                <code>{item.call}</code>
              </span>
            </span>
          ))}
        </span>
      </div>

      <Cursor
        to={pointer}
        on={step >= 6 && step <= 9}
        click={step === 7 || step === 9}
        travel={step === 8 ? 600 : 800}
      />
    </>
  );
}

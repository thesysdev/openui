"use client";

import clsx from "clsx";
import { LoaderCircle } from "lucide-react";
import {
  createContext,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";
import { AnimatedLabel, prefersReducedMotion } from "./AnimatedLabel";
import { BuildFeedPanel } from "./StatusPill";
import { styles as artifactStyles, names } from "./cloudArtifact.styles";
import { pendingLoaderStyles as styles } from "./pendingLoader.styles";

export interface PendingLoaderProps {
  /**
   * Text for a note over the sketch, in place of the build's feed. A new label drifts in.
   */
  label?: string;
  /** The color the sketch is drawn in, as any CSS color. Defaults to the text color. */
  color?: string;
  /**
   * Draws a dotted title and description at the top of the sketch, for a host that shows the
   * dashboard's title above it but has none yet. Turn it off once the title is there.
   */
  heading?: boolean;
}

/*
 * A dotted sketch of a dashboard, drawn widget by widget: each outline is traced in small round
 * dots, then its insides fade in, then the next widget starts. Once all are drawn it holds,
 * fades, and draws the other layout. Nobody knows yet what the build will make, so it's a
 * generic dashboard. With reduced motion it's the finished sketch, still.
 */

/** When the first widget starts, and how far apart widgets start (ms). */
const FIRST_MS = 300;
const STEP_MS = 1100;
/** A widget's insides start this long after its outline. */
const INSIDE_MS = 1000;
/** One sketch, from its first dot to the start of its fade; then the fade and a breath. */
const CYCLE_MS = 12_000;
const FADE_MS = 900;
const GAP_MS = 400;
/** From this width the sketch lays widgets side by side. */
const WIDE_PX = 640;

const WideContext = createContext(true);

/** When widget `i` starts. */
const at = (i: number) => FIRST_MS + i * STEP_MS;
const delay = (ms: number): CSSProperties => ({ animationDelay: `${ms}ms` });

/** A dotted outline at the box's size: traced on around it from the top left, or faded in. */
function DotBox({
  style,
  radius = 14,
  start,
  trace = false,
}: {
  style?: CSSProperties;
  radius?: number;
  start: number;
  trace?: boolean;
}) {
  const id = `openui-sketch-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <div
      className={clsx(styles.box, !trace && styles.fades)}
      style={{ ...style, ...(trace ? null : delay(start)) }}
    >
      <svg aria-hidden>
        {trace && (
          <defs>
            <mask id={id} x="-10%" y="-10%" width="120%" height="120%">
              {/* A wide white stroke drawn along the same path uncovers the dots under it. */}
              <rect
                className={styles.traced}
                style={delay(start)}
                width="100%"
                height="100%"
                rx={radius}
                pathLength={1}
                strokeDasharray="1 2"
                fill="none"
                stroke="#fff"
                strokeWidth={8}
              />
            </mask>
          </defs>
        )}
        <rect
          width="100%"
          height="100%"
          rx={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeDasharray="0 5"
          strokeLinecap="round"
          mask={trace ? `url(#${id})` : undefined}
        />
      </svg>
    </div>
  );
}

/** Dots where text will be. */
function DotLine({
  width,
  start,
  strong,
}: {
  width: string | number;
  start: number;
  strong?: boolean;
}) {
  return (
    <span
      className={clsx(styles.line, styles.fades, strong && styles.strong)}
      style={{ width, flexShrink: 0, ...delay(start) }}
    />
  );
}

/** One widget: its outline traced at `i`'s turn, its insides after it. */
function Widget({
  i,
  style,
  children,
}: {
  i: number;
  style?: CSSProperties;
  children?: ReactNode;
}) {
  return (
    <div className={styles.widget} style={style}>
      <DotBox trace start={at(i)} style={{ position: "absolute", inset: 0 }} />
      <div className={styles.inside}>{children}</div>
    </div>
  );
}

/** Columns of the five-column grid a widget spans when wide. Narrow, every widget is a full row. */
const span = (columns: number): CSSProperties => ({ gridColumn: `span ${columns}` });

function Row({ children }: { children: ReactNode }) {
  const wide = useContext(WideContext);
  return (
    <div
      className={styles.row}
      style={wide ? undefined : { gridTemplateColumns: "minmax(0, 1fr)" }}
    >
      {children}
    </div>
  );
}

/** Dots where a title and its description will be, drawn before the widgets. */
function Heading() {
  return (
    <div className={styles.heading}>
      <DotLine start={FIRST_MS - 200} width="min(320px, 40%)" strong />
      <DotLine start={FIRST_MS - 100} width="min(520px, 70%)" />
    </div>
  );
}

/** The filters most dashboards open with, traced together first. */
function Filters({ i }: { i: number }) {
  const wide = useContext(WideContext);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, height: 32 }}>
      <DotBox trace start={at(i)} radius={16} style={{ height: 32, width: 128 }} />
      <DotBox trace start={at(i)} radius={16} style={{ height: 32, width: 128 }} />
      {wide && (
        <DotBox
          trace
          start={at(i)}
          radius={16}
          style={{ height: 32, width: 160, marginLeft: "auto" }}
        />
      )}
    </div>
  );
}

function Kpis({ i, cells }: { i: number; cells: 3 | 4 }) {
  const wide = useContext(WideContext);
  const inside = at(i) + INSIDE_MS;
  const shown = wide ? cells : 2;
  return (
    <Widget i={i} style={{ height: 112 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${shown}, minmax(0, 1fr))`,
          gap: 24,
          height: "100%",
        }}
      >
        {Array.from({ length: shown }, (_, n) => (
          <div
            key={n}
            style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 12 }}
          >
            <DotLine start={inside + n * 60} width={64} />
            <DotLine start={inside + n * 60 + 120} width={112} strong />
            <DotLine start={inside + n * 60 + 240} width={40} />
          </div>
        ))}
      </div>
    </Widget>
  );
}

function Columns({ i, heights, columns = 5 }: { i: number; heights: number[]; columns?: number }) {
  const inside = at(i) + INSIDE_MS;
  return (
    <Widget i={i} style={{ height: 300, ...span(columns) }}>
      <DotLine start={inside} width={128} />
      <div
        style={{
          display: "flex",
          flex: 1,
          alignItems: "flex-end",
          gap: "5%",
          minHeight: 0,
          padding: "0 4px",
        }}
      >
        {heights.map((h, n) => (
          <DotBox
            key={n}
            start={inside + 80 + n * 50}
            radius={6}
            style={{ flex: 1, height: `${h}%` }}
          />
        ))}
      </div>
      <DotLine start={inside + 80} width="100%" />
    </Widget>
  );
}

function Bars({ i, widths, columns = 5 }: { i: number; widths: number[]; columns?: number }) {
  const inside = at(i) + INSIDE_MS;
  return (
    <Widget i={i} style={{ height: 300, ...span(columns) }}>
      <DotLine start={inside} width={96} />
      <div
        style={{
          display: "flex",
          flex: 1,
          flexDirection: "column",
          justifyContent: "center",
          gap: 20,
        }}
      >
        {widths.map((w, n) => (
          <div key={n} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <DotLine start={inside + 80 + n * 60} width={48} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <DotBox
                start={inside + 120 + n * 60}
                radius={4}
                style={{ height: 12, width: `${w}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Widget>
  );
}

function Donut({ i, columns = 5 }: { i: number; columns?: number }) {
  const inside = at(i) + INSIDE_MS;
  return (
    <Widget i={i} style={{ height: 260, ...span(columns) }}>
      <DotLine start={inside} width={112} />
      <div style={{ display: "flex", flex: 1, alignItems: "center", gap: 24, minWidth: 0 }}>
        <DotBox
          start={inside + 80}
          radius={999}
          style={{ aspectRatio: "1", width: 128, maxWidth: "40%", flexShrink: 0 }}
        />
        <div style={{ display: "flex", flex: 1, flexDirection: "column", gap: 12, minWidth: 0 }}>
          {[0, 1, 2, 3].map((n) => (
            <DotLine key={n} start={inside + 160 + n * 60} width={80} />
          ))}
        </div>
      </div>
    </Widget>
  );
}

function Table({ i, rows, columns = 5 }: { i: number; rows: number; columns?: number }) {
  const inside = at(i) + INSIDE_MS;
  return (
    <Widget i={i} style={span(columns)}>
      <DotLine start={inside} width={128} />
      <div style={{ display: "flex", flexDirection: "column", gap: 20, padding: "4px 0" }}>
        {Array.from({ length: rows }, (_, n) => (
          <div
            key={n}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 24,
            }}
          >
            <DotLine start={inside + 80 + n * 60} width="33%" />
            <DotLine start={inside + 80 + n * 60} width="16%" />
            <DotLine start={inside + 80 + n * 60} width="8%" />
          </div>
        ))}
      </div>
    </Widget>
  );
}

// Two generic dashboards, drawn in turn.
const LAYOUTS: (() => ReactNode)[] = [
  () => (
    <>
      <Filters i={0} />
      <Kpis i={1} cells={4} />
      <Row>
        <Columns i={2} heights={[42, 66, 50, 82, 60, 94, 70, 54]} columns={3} />
        <Bars i={3} widths={[88, 64, 52, 38]} columns={2} />
      </Row>
      <Table i={4} rows={4} />
      <Row>
        <Donut i={5} columns={2} />
        <Columns i={5} heights={[58, 72, 46, 80, 66, 52]} columns={3} />
      </Row>
    </>
  ),
  () => (
    <>
      <Filters i={0} />
      <Kpis i={1} cells={3} />
      <Columns i={2} heights={[36, 44, 40, 52, 48, 60, 56, 66, 62, 74, 70, 82]} />
      <Row>
        <Bars i={3} widths={[82, 70, 46, 30]} columns={2} />
        <Table i={4} rows={4} columns={3} />
      </Row>
      <Row>
        <Columns i={5} heights={[52, 60, 44, 70, 64, 78]} columns={3} />
        <Donut i={5} columns={2} />
      </Row>
    </>
  ),
];

/** Whether the element is at least `WIDE_PX` wide, kept current as it resizes. */
function useWide(ref: RefObject<HTMLElement | null>) {
  const [wide, setWide] = useState(true);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const measure = () => setWide(element.clientWidth >= WIDE_PX);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
  return wide;
}

/** `Pending`'s default: a dotted sketch of a dashboard, with the build's feed over it. */
export function PendingLoader({ label, color, heading = false }: PendingLoaderProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const wide = useWide(stageRef);
  const [moving] = useState(() => !prefersReducedMotion());
  const [cycle, setCycle] = useState(0);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!moving) return;
    const fade = setTimeout(() => setLeaving(true), CYCLE_MS);
    const next = setTimeout(
      () => {
        setLeaving(false);
        setCycle((n) => n + 1);
      },
      CYCLE_MS + FADE_MS + GAP_MS,
    );
    return () => {
      clearTimeout(fade);
      clearTimeout(next);
    };
  }, [moving, cycle]);

  const Layout = LAYOUTS[cycle % LAYOUTS.length] ?? LAYOUTS[0]!;
  const style = { "--openui-pending-color": color } as CSSProperties;

  return (
    <div className={clsx(styles.root, names.pending)} style={style}>
      <div ref={stageRef} className={styles.stage} aria-hidden="true">
        {/* A new key draws the next sketch from its first dot. */}
        <div key={cycle} className={clsx(styles.sketch, leaving && styles.hidden)}>
          {heading && <Heading />}
          <WideContext.Provider value={wide}>
            <Layout />
          </WideContext.Provider>
        </div>
      </div>
      <div className={styles.overlay}>
        {label === undefined ? (
          <BuildFeedPanel />
        ) : (
          <div className={styles.note} role="status">
            <LoaderCircle
              className={clsx(artifactStyles.spinner, names.spinner)}
              size={14}
              aria-hidden
            />
            <AnimatedLabel
              text={label ?? "Thinking…"}
              className={clsx(artifactStyles.shimmer, artifactStyles.loaderText, names.loaderText)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

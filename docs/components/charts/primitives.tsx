"use client";

import { createContext, useContext, useId, useLayoutEffect, useRef, type ReactNode } from "react";
import { BRAND_MARKS, markViewBox } from "./brand-marks";
import { MASCOT_SHAPES, MASCOT_VIEWBOX } from "./openui-mascot";
import s from "./viz.module.css";

export const SLOT = [s.s1, s.s2, s.s3] as const;
export const slotClass = (slot: 1 | 2 | 3) => SLOT[slot - 1];

/**
 * Chart skin. The blog ships the plain skin; /benchmarks wraps its content in
 * <VizSkin vivid> to switch every descendant chart to the marketing treatment
 * documented at the bottom of viz.module.css (stamps, tracks, striped OpenUI
 * fills, 28px marks). Components read it with useVizSkin().
 */
const VizSkinContext = createContext<{ vivid: boolean }>({ vivid: false });

export function VizSkin({ vivid = false, children }: { vivid?: boolean; children: ReactNode }) {
  return <VizSkinContext.Provider value={{ vivid }}>{children}</VizSkinContext.Provider>;
}

export const useVizSkin = () => useContext(VizSkinContext);

/**
 * One-shot viewport reveal for the vivid skin: the card is put into the
 * `revealPre` state (bars at zero, labels transparent — pure transform/opacity,
 * nothing reflows) before the first post-hydration paint, and the class is
 * dropped when ~a quarter of the card scrolls into view, letting the CSS in
 * viz.module.css §6 run the grow-from-zero transition exactly once.
 *
 * Class-driven rather than state-driven: a reveal never needs a re-render, and
 * server markup carries no class at all, so charts are fully drawn without JS
 * and for anyone who prefers reduced motion.
 */
function useReveal(enabled: boolean) {
  const ref = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!enabled || !el) return;
    if (
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    el.classList.add(s.revealPre);
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        /* double rAF so the armed state is painted before the transition runs */
        requestAnimationFrame(() => requestAnimationFrame(() => el.classList.remove(s.revealPre)));
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [enabled]);

  return ref;
}

export function Mark({ id }: { id?: string }) {
  /* the mascot is the nav's own artwork: baked colours, drawn edge to edge so
     it rasterises as crisply here as it does in the site header */
  if (id === "openui") {
    return (
      <svg className={s.mascot} viewBox={MASCOT_VIEWBOX} aria-hidden>
        {MASCOT_SHAPES.map((shape, i) => (
          <path
            key={i}
            d={shape.d}
            fill={shape.fill}
            stroke={shape.stroke}
            strokeWidth={shape.strokeWidth}
          />
        ))}
      </svg>
    );
  }
  const d = id ? BRAND_MARKS[id] : undefined;
  if (!d) return null;
  return (
    <svg viewBox={markViewBox(id)} aria-hidden>
      <path d={d} fill="currentColor" />
    </svg>
  );
}

/** The 20px square logo chip from the reviewed design. */
export function Chip({ mark }: { mark?: string }) {
  if (!mark) return null;
  return (
    <span className={s.chip} aria-hidden>
      <Mark id={mark} />
    </span>
  );
}

export function Chart({
  title,
  sub,
  legend,
  note,
  tight,
  children,
}: {
  title: string;
  sub?: string;
  legend?: Array<{ label: string; slot: 1 | 2 | 3 }>;
  note?: ReactNode;
  tight?: boolean;
  children: ReactNode;
}) {
  const { vivid } = useVizSkin();
  const revealRef = useReveal(vivid);
  const headingId = useId();
  const descriptionId = useId();
  return (
    <figure
      ref={revealRef}
      className={`${s.viz} ${tight ? s.tight : ""} ${vivid ? s.vivid : ""}`}
      aria-labelledby={headingId}
      aria-describedby={sub ? descriptionId : undefined}
    >
      <figcaption className={s.head}>
        <p id={headingId} className={s.title}>
          {title}
        </p>
        {sub ? (
          <p id={descriptionId} className={s.sub}>
            {sub}
          </p>
        ) : null}
      </figcaption>
      {children}
      {legend ? (
        <div className={s.legend}>
          {legend.map((k) => (
            <span key={k.label} className={`${s.key} ${slotClass(k.slot)}`}>
              <span className={s.dot} aria-hidden />
              {k.label}
            </span>
          ))}
        </div>
      ) : null}
      {note ? <p className={s.note}>{note}</p> : null}
    </figure>
  );
}

/**
 * A disclosure table together with its own horizontal scroller. The scroller
 * wraps the table and nothing else, so a wide table slides sideways while the
 * heading and note above it stay where they are, and two tables inside one
 * disclosure scroll independently instead of moving as one sheet.
 */
export function DataTable({ children }: { children: ReactNode }) {
  return (
    <div className={s.dataScroller}>
      <table className={s.dataTable}>{children}</table>
    </div>
  );
}

/**
 * A visible-on-demand semantic equivalent for a chart. It stays in the
 * server-rendered document, so crawlers and assistive technology can recover
 * exact values without executing hover interactions or interpreting pixels.
 */
export function ChartDataDisclosure({
  label = "View data",
  children,
}: {
  label?: string;
  children: ReactNode;
}) {
  return (
    <details className={s.dataDisclosure}>
      <summary>{label}</summary>
      <div className={s.dataDisclosureBody}>{children}</div>
    </details>
  );
}

/** One 32px row: logo chip + name on the left, bar and value in the body. */
export function Row({
  label,
  mark,
  wide,
  tip,
  children,
}: {
  label: string;
  mark?: string;
  /** Wider name column for long labels (failure families). */
  wide?: boolean;
  /** Plain-language tooltip shown on hover, rendered by the .tip CSS. */
  tip?: string;
  children: ReactNode;
}) {
  return (
    <div className={`${s.row} ${tip ? s.tip : ""}`} data-tip={tip}>
      <span className={`${s.rowName} ${wide ? s.rowNameWide : ""}`}>
        <Chip mark={mark} />
        <span className={s.rowLabel}>{label}</span>
      </span>
      <span className={s.rowBody}>{children}</span>
    </div>
  );
}

export { s as styles };

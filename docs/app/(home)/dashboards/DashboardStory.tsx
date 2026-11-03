"use client";

import { Blocks, Database, Pause, PencilLine, Play, RefreshCw, SquareFunction } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import styles from "./DashboardStory.module.css";
import page from "./page.module.css";
import type { LookId } from "./story/Dashboard";
import { FILM_LENGTH, FILM_STEPS, Film } from "./story/Film";

/* One request, step by step. The film above the steps plays the same request
   through: the query and its missing endpoint, the generated script, the live
   trend refreshing, a theme switch, and a one-chart edit. Each step's progress
   rule tracks the film's clock, and choosing a step jumps the film to it. */
const POINTS = [
  {
    id: "fetch",
    Icon: Database,
    title: "Live data",
    description: "Dashboards query your APIs through your tools. The model only writes the query.",
  },
  {
    id: "transform",
    Icon: SquareFunction,
    title: "Calculated fields",
    description: "Missing a metric? A generated script calculates it in a safe interpreter.",
  },
  {
    id: "refresh",
    Icon: RefreshCw,
    title: "Auto-refresh",
    description: "Filters and refreshes load new data into the same layout. Nothing regenerates.",
  },
  {
    id: "components",
    Icon: Blocks,
    title: "On brand",
    description: "Every chart, table, and filter is a component from your design system.",
  },
  {
    id: "edit",
    Icon: PencilLine,
    title: "Targeted edits",
    description: "Ask for a new chart or filter. Only that part changes. The rest stays put.",
  },
];

/* Reduced motion rests on this moment until the reader presses play: the
   query read for its data, with the missing endpoint marked. */
const STILL = 7.4;

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
const readReducedMotion = () => window.matchMedia(REDUCED_MOTION).matches;
const subscribeReducedMotion = (onChange: () => void) => {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};

/* Five points under one film, advancing with its clock. The film plays only
   while the stage is on screen and not paused. */
export function DashboardStory() {
  const stage = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLOListElement>(null);
  /* A reader's own swipe holds the rail where they put it for a few seconds. */
  const railHeldUntil = useRef(0);
  const [time, setTime] = useState(0);
  const [started, setStarted] = useState(false);
  const [look, setLook] = useState<LookId | null>(null);
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    readReducedMotion,
    () => false,
  );
  const [pausedChoice, setPausedChoice] = useState<boolean | null>(null);
  const paused = pausedChoice ?? reducedMotion;
  const [visible, setVisible] = useState(false);
  const running = visible && !paused;
  const T = reducedMotion && !started ? STILL : time;
  const active = FILM_STEPS.findIndex((step) => T < step.start + step.length);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      threshold: 0.35,
    });
    if (stage.current) observer.observe(stage.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!running) return;
    let frame = 0;
    let last: number | null = null;
    const tick = (now: number) => {
      // Cap the step so a background tab doesn't jump the film forward.
      const dt = last === null ? 0 : Math.min(0.1, (now - last) / 1000);
      last = now;
      setTime((t) => (t + dt) % FILM_LENGTH);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running]);

  /* Below desktop the points are a swipeable rail. Keep the active point in
     view as the film advances, unless the reader is scrolling it themselves. */
  useEffect(() => {
    const list = rail.current;
    const item = list?.children[active] as HTMLElement | undefined;
    if (!list || !item || !visible || list.scrollWidth <= list.clientWidth) return;
    if (Date.now() < railHeldUntil.current) return;
    const inset = parseFloat(getComputedStyle(list).scrollPaddingLeft) || 0;
    list.scrollTo({ left: item.offsetLeft - inset, behavior: reducedMotion ? "auto" : "smooth" });
  }, [active, visible, reducedMotion]);

  const holdRail = () => {
    railHeldUntil.current = Date.now() + 5000;
  };

  /* Jump to a step and play it from its start. */
  const goTo = (index: number) => {
    setTime(FILM_STEPS[index].start);
    setStarted(true);
    setLook(null);
    setPausedChoice(false);
  };

  return (
    <section
      className={`${page.section} ${page.sectionWide}`}
      aria-labelledby="dashboard-story-title"
    >
      <div className={page.container}>
        <div className={page.lockup}>
          <h2 id="dashboard-story-title" className={page.heading}>
            Ask once. The dashboard keeps up.
          </h2>
          <p className={page.lead}>
            Dashboards query your APIs, compute what’s missing, and render with your own components.
          </p>
        </div>

        <div className={styles.stage} ref={stage}>
          <div className={styles.scene} data-scene={POINTS[active].id}>
            <Film
              T={T}
              look={look}
              onLook={(next) => {
                // Picking a theme holds the film on it.
                setLook(next);
                setPausedChoice(true);
              }}
            />
          </div>
          <button
            type="button"
            className={styles.toggle}
            onClick={() => {
              if (paused) {
                if (reducedMotion && !started) {
                  setTime(STILL);
                  setStarted(true);
                }
                setLook(null);
              }
              setPausedChoice(!paused);
            }}
            aria-label={paused ? "Play" : "Pause"}
          >
            {paused ? (
              <Play size={14} strokeWidth={2.25} />
            ) : (
              <Pause size={14} strokeWidth={2.25} />
            )}
          </button>
        </div>

        <ol
          className={styles.points}
          ref={rail}
          onPointerDown={holdRail}
          onTouchStart={holdRail}
          onWheel={holdRail}
        >
          {POINTS.map(({ id, Icon, title, description }, index) => {
            const step = FILM_STEPS[index];
            const progress =
              index === active ? Math.min(1, Math.max(0, (T - step.start) / step.length)) : 0;
            return (
              <li key={id} className={styles.point} data-active={index === active || undefined}>
                <button
                  type="button"
                  className={styles.pointButton}
                  aria-current={index === active ? "step" : undefined}
                  onClick={() => goTo(index)}
                >
                  <span className={styles.track} aria-hidden="true">
                    <span className={styles.fill} style={{ transform: `scaleX(${progress})` }} />
                  </span>
                  <Icon
                    className={styles.pointIcon}
                    size={20}
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                  <span className={styles.pointTitle}>{title}</span>
                  <span className={styles.pointDescription}>{description}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

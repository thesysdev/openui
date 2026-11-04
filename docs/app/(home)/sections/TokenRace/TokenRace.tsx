"use client";

import { DECODE_TOKENS_PER_SECOND, speedScenarios, type SpeedFormatId } from "@/lib/benchmark-data";
import { Check, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import styles from "./TokenRace.module.css";

/* The "3x faster, 67% fewer tokens" claim, shown rather than stated. It comes
   from the speed benchmark's contact-form screen (lib/benchmark-data.ts): the
   same screen encoded three ways, timed at the benchmark's fixed decode rate.
   Every bar streams at that rate, so the one with the fewest tokens finishes
   first. The animation runs faster than real time; the seconds shown are the
   benchmark's. */

const SCENARIO = speedScenarios.find((row) => row.scenario === "contact-form")!;

export type RaceRow = { id: SpeedFormatId; label: string; note?: string };

const DEFAULT_ROWS: RaceRow[] = [
  { id: "openuiLang", label: "OpenUI" },
  { id: "c1Json", label: "JSON" },
  { id: "jsonRenderPatch", label: "json-render", note: "by Vercel" },
];

const LONGEST_MS = 6000;

export function TokenRace({
  rows = DEFAULT_ROWS,
  caption = "Building the same contact form, streaming at the same speed",
  compact = false,
}: {
  rows?: RaceRow[];
  caption?: string;
  /** Tighter padding and no outer margin, for use inside another layout. */
  compact?: boolean;
} = {}) {
  const MAX_TOKENS = Math.max(...rows.map(({ id }) => SCENARIO[id]));
  const ref = useRef<HTMLDivElement>(null);
  const [elapsed, setElapsed] = useState(0);
  const [run, setRun] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // Show the finished race, set from a frame callback rather than the effect body.
      const frame = requestAnimationFrame(() => setElapsed(LONGEST_MS));
      return () => cancelAnimationFrame(frame);
    }
    let frame = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const next = Math.min(LONGEST_MS, now - t0);
      setElapsed(next);
      if (next < LONGEST_MS) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [started, run]);

  const done = elapsed >= LONGEST_MS;

  return (
    <div ref={ref} className={`${styles.race} ${compact ? styles.raceCompact : ""}`.trim()}>
      <div className={styles.head}>
        <span>{caption}</span>
        <button
          type="button"
          className={styles.replay}
          onClick={() => setRun((r) => r + 1)}
          disabled={!done}
          aria-label="Replay"
          title="Replay"
        >
          <RotateCcw size={13} />
        </button>
      </div>
      <ol className={styles.rows}>
        {rows.map(({ id, label, note }) => {
          const total = SCENARIO[id];
          const duration = (total / MAX_TOKENS) * LONGEST_MS;
          const progress = Math.min(1, elapsed / duration);
          const finished = progress >= 1;
          const seconds = total / DECODE_TOKENS_PER_SECOND;
          return (
            <li
              key={id}
              className={`${styles.row} ${id === "openuiLang" ? styles.rowOpenui : ""}`.trim()}
            >
              <span className={styles.name}>
                {label}
                {note && <span className={styles.vendor}> {note}</span>}
              </span>
              <span className={styles.track}>
                <span
                  className={styles.fill}
                  style={{ width: `${(progress * total * 100) / MAX_TOKENS}%` }}
                />
              </span>
              <span className={styles.count}>
                {Math.round(progress * total).toLocaleString("en-US")} tokens
              </span>
              <span className={`${styles.status} ${finished ? styles.statusDone : ""}`.trim()}>
                {finished ? (
                  <>
                    <Check size={13} strokeWidth={2.5} /> {seconds.toFixed(1)}s
                  </>
                ) : started ? (
                  `${((progress * total) / DECODE_TOKENS_PER_SECOND).toFixed(1)}s`
                ) : (
                  ""
                )}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

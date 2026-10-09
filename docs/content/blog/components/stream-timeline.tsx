"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./intelligent-ui-demo.module.css";
import { PauseIcon, ReplayIcon, useReducedMotion } from "./playback";

// Event times in seconds from one captured response (6,341 characters of DIL).
const END = 26;
const SETUP = [0, 0.06, 0.27, 0.62, 0.83, 2.02, 6.58];
const REASONING = { start: 2.02, end: 2.55 };
const TEXT = { start: 2.54, end: 21.26 };
const FULL = [
  2.54, 2.76, 3.08, 3.79, 4.2, 4.48, 4.69, 5.0, 5.67, 5.9, 6.22, 6.36, 6.83, 7.36, 7.76, 8.0, 8.27,
  8.47, 8.7, 9.17, 9.4, 10.12, 10.51, 10.96, 11.75, 11.89, 12.17, 12.35, 12.68, 12.82, 13.53, 14.01,
  14.2, 14.9, 15.36, 15.6, 16.28, 16.55, 16.73, 17.59, 17.67, 17.88, 18.41, 18.57, 19.04, 19.33,
  19.5, 19.99, 20.43, 20.65, 20.89, 21.17,
];
const CONSTANTS = [
  5.17, 5.45, 7.06, 11.24, 13.27, 14.44, 15.13, 16.16, 17.08, 17.18, 18.1, 18.8, 19.84, 21.26,
];
const UNCHANGED = [3.24, 3.45, 6.59, 7.53, 8.93, 9.62, 10.27, 10.73, 11.43, 14.66];
const IMAGES = [
  { start: 3.79, duration: 1.44 },
  { start: 4.69, duration: 1.72 },
  { start: 5.9, duration: 1.56 },
  { start: 6.83, duration: 1.44 },
  { start: 7.76, duration: 1.51 },
];
const FINISH = [21.3, 21.99, 25.21, 25.46];

const REPLAY_MS = 9000;
const pct = (t: number) => `${(t / END) * 100}%`;
const count = (times: number[], t: number) => times.filter((x) => x <= t).length;

export function StreamTimeline() {
  const reducedMotion = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const [t, setT] = useState(END);
  const [playing, setPlaying] = useState(false);
  const started = useRef(false);
  const frame = useRef(0);

  const play = () => {
    cancelAnimationFrame(frame.current);
    const from = performance.now();
    setPlaying(true);
    const tick = (now: number) => {
      const next = Math.min(END, ((now - from) / REPLAY_MS) * END);
      setT(next);
      if (next < END) frame.current = requestAnimationFrame(tick);
      else setPlaying(false);
    };
    frame.current = requestAnimationFrame(tick);
  };

  const stop = () => {
    cancelAnimationFrame(frame.current);
    setPlaying(false);
    setT(END);
  };

  useEffect(() => {
    const node = ref.current;
    if (!node || reducedMotion) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          play();
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [reducedMotion]);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const hidden = (time: number) => time > t;
  const imagesDone = IMAGES.filter((img) => img.start + img.duration <= t).length;

  const stats = [
    { kind: "full", value: count(FULL, t), label: "Structure changed" },
    { kind: "constants", value: count(CONSTANTS, t), label: "Only text grew" },
    { kind: "unchanged", value: count(UNCHANGED, t), label: "Inside an unfinished tag" },
    { kind: "image", value: imagesDone, label: "Image results" },
  ];

  return (
    <figure
      ref={ref}
      className={`${styles.card} not-prose`}
      aria-label="Timeline of one streamed response: text streams for 18.7 seconds, with 52 structure updates, 14 text-only updates, 10 updates inside an unfinished tag, and five image searches that each resolve in 1.4 to 1.7 seconds."
    >
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Captured stream</p>
          <p className={styles.title}>One streamed response, update by update</p>
          <p className={styles.subtitle}>
            6,341 characters · 84 updates · text streamed for 18.7 s
          </p>
        </div>
        <button
          type="button"
          className={styles.control}
          onClick={playing ? stop : play}
          aria-label={playing ? "Stop replay" : "Replay the stream"}
        >
          {playing ? <PauseIcon /> : <ReplayIcon />}
          {playing ? "Stop" : "Replay"}
        </button>
      </div>

      <div className={styles.stats}>
        {stats.map((s) => (
          <div key={s.kind} className={styles.stat}>
            <span className={styles.statValue}>
              <span className={styles.key} data-kind={s.kind} aria-hidden="true" />
              {s.value}
            </span>
            <span className={styles.statLabel}>{s.label}</span>
          </div>
        ))}
      </div>

      <div className={styles.chart}>
        {[
          ["Setup", 1],
          ["Reasoning", 2],
          ["Raw text", 3],
          ["Compiled UI", 4],
          ["Images", 5],
          ["Finish", 6],
        ].map(([label, row]) => (
          <span key={label} className={styles.laneLabel} style={{ gridRow: row }}>
            {label}
          </span>
        ))}

        {/* Gridlines and playhead span every lane. */}
        <div style={{ gridColumn: 2, gridRow: "1 / 7", position: "relative" }} aria-hidden="true">
          {[0, 5, 10, 15, 20, 25].map((s) => (
            <span key={s} className={styles.grid} style={{ left: pct(s) }} />
          ))}
          {playing && <span className={styles.playhead} style={{ left: pct(t) }} />}
        </div>

        <div className={styles.lane} style={{ gridColumn: 2, gridRow: 1 }}>
          {SETUP.map((s, i) => (
            <span
              key={i}
              className={`${styles.mark} ${styles.tick}`}
              data-kind="setup"
              data-hidden={hidden(s)}
              style={{ left: pct(s) }}
            />
          ))}
        </div>

        <div className={styles.lane} style={{ gridColumn: 2, gridRow: 2 }}>
          <span
            className={`${styles.mark} ${styles.span}`}
            data-kind="reasoning"
            data-hidden={hidden(REASONING.start)}
            style={{
              left: pct(REASONING.start),
              width: pct(Math.max(0, Math.min(t, REASONING.end) - REASONING.start)),
            }}
          />
        </div>

        <div className={styles.lane} style={{ gridColumn: 2, gridRow: 3 }}>
          <span
            className={styles.textFill}
            style={{
              left: pct(TEXT.start),
              width: pct(Math.max(0, Math.min(t, TEXT.end) - TEXT.start)),
            }}
          />
        </div>

        <div className={styles.lane} data-size="tall" style={{ gridColumn: 2, gridRow: 4 }}>
          {FULL.map((s) => (
            <span
              key={`f${s}`}
              className={`${styles.mark} ${styles.tick}`}
              data-kind="full"
              data-hidden={hidden(s)}
              style={{ left: pct(s) }}
            />
          ))}
          {CONSTANTS.map((s) => (
            <span
              key={`c${s}`}
              className={`${styles.mark} ${styles.tick}`}
              data-kind="constants"
              data-hidden={hidden(s)}
              style={{ left: pct(s) }}
            />
          ))}
          {UNCHANGED.map((s) => (
            <span
              key={`u${s}`}
              className={`${styles.mark} ${styles.ring}`}
              data-hidden={hidden(s)}
              style={{ left: pct(s) }}
            />
          ))}
        </div>

        <div className={styles.lane} data-size="images" style={{ gridColumn: 2, gridRow: 5 }}>
          {IMAGES.map((img, i) => (
            <span
              key={i}
              className={`${styles.mark} ${styles.image}`}
              data-hidden={hidden(img.start)}
              style={{ left: pct(img.start), top: 10 + i * 13 }}
            >
              <span
                className={styles.imageBar}
                style={{
                  width: `${(Math.max(0, Math.min(t - img.start, img.duration)) / END) * 100}cqw`,
                }}
              />
              {img.start + img.duration <= t && (
                <span className={styles.imageLabel}>{img.duration.toFixed(1)} s</span>
              )}
            </span>
          ))}
        </div>

        <div className={styles.lane} style={{ gridColumn: 2, gridRow: 6 }}>
          {FINISH.map((s, i) => (
            <span
              key={i}
              className={`${styles.mark} ${styles.tick}`}
              data-kind="setup"
              data-hidden={hidden(s)}
              style={{ left: pct(s) }}
            />
          ))}
          {t >= FINISH[0] && (
            <span className={styles.finishLabel} style={{ left: pct(FINISH[0]) }}>
              last token
            </span>
          )}
          {t >= FINISH[2] && (
            <span className={styles.finishLabel} style={{ left: pct(FINISH[2]) }}>
              closed
            </span>
          )}
        </div>

        <div className={styles.axis} style={{ gridColumn: 2, gridRow: 7 }} aria-hidden="true">
          {[0, 5, 10, 15, 20, 25].map((s) => (
            <span key={s} className={styles.axisLabel} style={{ left: pct(s) }}>
              {s}s
            </span>
          ))}
        </div>
      </div>

      <div className={styles.legend}>
        <span className={styles.legendItem}>
          <span className={styles.key} data-kind="full" aria-hidden="true" />
          Full recompile: the whole program is resent
        </span>
        <span className={styles.legendItem}>
          <span className={styles.key} data-kind="constants" aria-hidden="true" />
          Constants patch only
        </span>
        <span className={styles.legendItem}>
          <span className={styles.key} data-kind="unchanged" aria-hidden="true" />
          No UI change
        </span>
        <span className={styles.legendItem}>
          <span className={styles.key} data-kind="image" aria-hidden="true" />
          Image search, tag closed to result
        </span>
      </div>
    </figure>
  );
}

"use client";

import { FORMAT_ORDER, FORMATS, tokens, type FormatId } from "@/lib/benchmark-data";
import { Check, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import styles from "./BlockRace.module.css";

/* Three horizontal bars that fill one block at a time, every bar at the same
   rate, the same streaming speed. Each block is BLOCK_TOKENS of output, so a
   bar stops at the benchmark's mean output per screen for its format
   (lib/benchmark-data.ts, the 46-screen run) and OpenUI's finishes first. */

const BLOCK_TOKENS = 100;
const BLOCK_MS = 90;

const NOTES: Record<FormatId, string> = {
  openui: "",
  a2ui: "by Google",
  jsonRender: "by Vercel",
};

const BARS = FORMAT_ORDER.map((id) => ({
  id,
  label: FORMATS.find((f) => f.id === id)!.label,
  note: NOTES[id],
  total: tokens.outputPerScreen[id],
  blocks: Math.round(tokens.outputPerScreen[id] / BLOCK_TOKENS),
}));

const SLOTS = Math.max(...BARS.map((b) => b.blocks));

export function BlockRace() {
  const ref = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);
  const [filled, setFilled] = useState(0);
  const [run, setRun] = useState(0);

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
      { threshold: 0.4 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    // Reduced motion shows the finished race; otherwise it restarts from empty.
    // Both are set from a frame callback rather than the effect body.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const frame = requestAnimationFrame(() => setFilled(SLOTS));
      return () => cancelAnimationFrame(frame);
    }
    const frame = requestAnimationFrame(() => setFilled(0));
    const id = window.setInterval(() => {
      setFilled((f) => {
        if (f + 1 >= SLOTS) window.clearInterval(id);
        return Math.min(SLOTS, f + 1);
      });
    }, BLOCK_MS);
    return () => {
      cancelAnimationFrame(frame);
      window.clearInterval(id);
    };
  }, [started, run]);

  const done = filled >= SLOTS;

  return (
    <div ref={ref} className={styles.race}>
      <div className={styles.head}>
        <span>Tokens per generation</span>
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

      <ol className={styles.bars} style={{ ["--slots" as string]: SLOTS }}>
        {BARS.map((bar) => {
          const shown = Math.min(filled, bar.blocks);
          const finished = started && shown >= bar.blocks;
          const isOpenui = bar.id === "openui";
          const count = finished ? bar.total : shown * BLOCK_TOKENS;
          return (
            <li key={bar.id} className={`${styles.bar} ${isOpenui ? styles.barOpenui : ""}`.trim()}>
              <div className={styles.label}>
                <span className={styles.name}>
                  {bar.label}
                  {bar.note && <span className={styles.note}> {bar.note}</span>}
                </span>
                <span className={styles.count}>{count.toLocaleString("en-US")} tokens</span>
                <span className={styles.status}>
                  {finished ? (
                    isOpenui ? (
                      <span className={styles.badge}>
                        <Check size={11} strokeWidth={3} /> Ready first
                      </span>
                    ) : (
                      <span className={styles.done}>Done</span>
                    )
                  ) : started ? (
                    <span className={styles.working}>building…</span>
                  ) : null}
                </span>
              </div>
              <div className={styles.track} aria-hidden="true">
                {Array.from({ length: SLOTS }, (_, i) => (
                  <span
                    key={i < shown ? `${run}-${i}` : `empty-${i}`}
                    className={`${styles.slot} ${i < shown ? styles.block : ""} ${
                      i >= bar.blocks ? styles.slotUnused : ""
                    }`.trim()}
                  />
                ))}
              </div>
            </li>
          );
        })}
      </ol>

      <p className={styles.foot}>
        Each block is {BLOCK_TOKENS} tokens. Averages over 46 prompts and 6 AI models, streamed at
        the same speed.
      </p>
    </div>
  );
}

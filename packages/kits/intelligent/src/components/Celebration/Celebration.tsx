"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export interface CelebrationProps {
  /** Confetti bursts when this turns true. */
  when: boolean;
  /** While paused (e.g. the answer is still streaming), changes to when are ignored. */
  paused?: boolean;
}

const CONFETTI = ["var(--iui-chart-1)", "var(--iui-chart-2)", "var(--iui-chart-3)", "var(--iui-chart-4)", "var(--iui-chart-5)", "var(--iui-chart-6)"];

/** Bursts confetti over the page when its condition turns true. */
export function Celebration({ when, paused }: CelebrationProps) {
  const [burst, setBurst] = useState(0);
  const was = useRef<boolean | null>(null);
  useEffect(() => {
    if (paused) return;
    const now = when === true;
    if (was.current === false && now) setBurst((n) => n + 1);
    was.current = now;
  }, [when, paused]);
  useEffect(() => {
    if (!burst) return;
    const t = setTimeout(() => setBurst(0), 2200);
    return () => clearTimeout(t);
  }, [burst]);
  if (!burst || typeof document === "undefined") return null;
  return createPortal(
    <div className="iui-confetti" aria-hidden key={burst}>
      {Array.from({ length: 70 }, (_, i) => (
        <i
          key={i}
          style={{
            left: `${(i * 37) % 100}%`,
            background: CONFETTI[i % CONFETTI.length],
            animationDelay: `${(i % 10) * 40}ms`,
            animationDuration: `${1200 + ((i * 53) % 900)}ms`,
            ["--x" as string]: `${((i * 71) % 200) - 100}px`,
            ["--r" as string]: `${(i * 97) % 720}deg`,
          }}
        />
      ))}
    </div>,
    document.body,
  );
}

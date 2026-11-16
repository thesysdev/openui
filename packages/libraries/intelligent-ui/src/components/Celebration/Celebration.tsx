"use client";

import { useTheme } from "@openuidev/react-components";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { tokens } from "../../shared/tokens";
import { celebrationStyles, DRIFT, names, SPIN } from "./celebration.styles";

export interface CelebrationProps {
  /** Confetti bursts when this turns true. */
  when: boolean;
  /** While paused (e.g. the answer is still streaming), changes to when are ignored. */
  paused?: boolean;
}

const CONFETTI = [
  tokens.chart1,
  tokens.chart2,
  tokens.chart3,
  tokens.chart4,
  tokens.chart5,
  tokens.chart6,
];

/** Bursts confetti over the page when its condition turns true. */
export function Celebration({ when, paused }: CelebrationProps) {
  // The confetti is portaled to body, outside the ThemeProvider's scope, so it carries the
  // provider's portal class to keep the theme's chart colours.
  const { portalThemeClassName } = useTheme();
  const [burst, setBurst] = useState(0);
  const was = useRef<boolean | null>(null);
  // Celebrate what the user just did: only after a click or key press since this mounted. Reopening
  // a finished chat remounts the answer with its condition false until the saved state is restored;
  // without this, the restore read as false → true and replayed the burst. The click that reopened
  // the chat came before this mounted, so it doesn't count.
  const acted = useRef(false);
  useEffect(() => {
    const act = () => {
      acted.current = true;
    };
    document.addEventListener("pointerdown", act, true);
    document.addEventListener("keydown", act, true);
    return () => {
      document.removeEventListener("pointerdown", act, true);
      document.removeEventListener("keydown", act, true);
    };
  }, []);
  useEffect(() => {
    if (paused) return;
    const now = when === true;
    if (was.current === false && now && acted.current) setBurst((n) => n + 1);
    was.current = now;
  }, [when, paused]);
  useEffect(() => {
    if (!burst) return;
    const t = setTimeout(() => setBurst(0), 2200);
    return () => clearTimeout(t);
  }, [burst]);
  if (!burst || typeof document === "undefined") return null;
  return createPortal(
    <div
      className={clsx(celebrationStyles.root, names.root, portalThemeClassName)}
      aria-hidden
      key={burst}
    >
      {Array.from({ length: 70 }, (_, i) => (
        <i
          key={i}
          className={clsx(celebrationStyles.piece, names.piece)}
          style={{
            left: `${(i * 37) % 100}%`,
            background: CONFETTI[i % CONFETTI.length],
            animationDelay: `${(i % 10) * 40}ms`,
            animationDuration: `${1200 + ((i * 53) % 900)}ms`,
            [DRIFT as string]: `${((i * 71) % 200) - 100}px`,
            [SPIN as string]: `${(i * 97) % 720}deg`,
          }}
        />
      ))}
    </div>,
    document.body,
  );
}

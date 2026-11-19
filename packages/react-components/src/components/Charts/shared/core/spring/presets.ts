import type { SpringConfig } from "./spring";

/**
 * Named motion presets — the one table that defines how hover motion FEELS
 * across the library. Cross-chart parity (the bar band matching the line/area
 * crosshair, for instance) is structural here instead of comment-enforced in
 * scattered per-file constants. Tuning guide: stiffness ↑ = tighter tracking;
 * damping ≈ 2·√stiffness is critical (no overshoot), lower = bouncier. Edit a
 * value and the bench shows it live via HMR.
 *
 * Internal — never export from src/index.ts.
 */
export const springPresets = {
  /** Snappy-but-smooth follower: crosshair line, active dots, bar hover band. */
  crosshair: { stiffness: 320, damping: 26 },
  /** Softer — the highlight band glides/stretches a touch behind the dots. */
  highlight: { stiffness: 180, damping: 28 },
  /** Pie slice pop-out (matches bklit's pie hover feel). */
  popOut: { stiffness: 400, damping: 25 },
  /** Tooltip soft-follow — fast, critical damping (480/38 ⇒ no overshoot). */
  tooltip: { stiffness: 480, damping: 38 },
  /**
   * Line/area series data morph (replaces the removed `transition: d 0.3s`).
   * Critical damping (44 ≈ 2·√480) — data must never overshoot its value —
   * tuned so a typical retarget is visually settled in ~300–400ms, matching
   * the old tween's feel. Rest thresholds are much looser than the hover
   * springs': these scalars are pixel geometry, so a quarter-pixel at under
   * 5px/s is invisible — a tight threshold only kept the ticker running
   * through a motionless tail.
   */
  dataMorph: { stiffness: 480, damping: 44, restDelta: 0.25, restSpeed: 5 },
} satisfies Record<string, SpringConfig>;

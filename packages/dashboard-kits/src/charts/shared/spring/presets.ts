// Motion presets for the kit charts, the same values as react-ui's chart
// presets (components/Charts/shared/core/spring/presets.ts), so kit charts and
// react-ui charts move alike on the same dashboard.

import type { SpringConfig } from "./spring";

export const springPresets = {
  /** Snappy-but-smooth follower: the crosshair, its dots, a hovered block or bubble. */
  crosshair: { stiffness: 320, damping: 26 },
  /** Softer: a highlight that trails a touch behind the crosshair. */
  highlight: { stiffness: 180, damping: 28 },
  /** Tooltip soft-follow: fast, critical damping (no overshoot). */
  tooltip: { stiffness: 480, damping: 38 },
  /**
   * Series data morph: critical damping, so data never overshoots its value;
   * a retarget settles in about 300–400ms.
   */
  dataMorph: { stiffness: 480, damping: 44, restDelta: 0.25, restSpeed: 5 },
  /** A single value easing into place (a gauge filling): settles in about 600ms. */
  value: { stiffness: 140, damping: 24, restDelta: 0.0005, restSpeed: 0.005 },
} satisfies Record<string, SpringConfig>;

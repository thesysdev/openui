import clsx from "clsx";
import { useState } from "react";
import { MascotArt } from "./Mascot";
import { MASCOT_VIEWBOX } from "./mascotPaths";

/** Keep in sync with the pulse duration in mascotLoader.scss. */
const PULSE_MS = 1600;

/**
 * The OpenUI mascot as a loader: a light grey (low-opacity) mascot whose
 * opacity pulses on a loop; the eyes stay still. Decorative only, so callers
 * own the status semantics. Holds still under `prefers-reduced-motion`.
 *
 * Every instance pulses on the same clock, so when one loader hands off to
 * another (the reply loader to the "Working" row) the pulse carries on
 * instead of restarting.
 */
export const MascotLoader = ({ size = 28, className }: { size?: number; className?: string }) => {
  const [delay] = useState(() =>
    typeof performance === "undefined" ? 0 : -(performance.now() % PULSE_MS),
  );
  return (
    <svg
      viewBox={MASCOT_VIEWBOX}
      width={size}
      height={(size * 161) / 201}
      fill="none"
      aria-hidden="true"
      className={clsx("openui-agent-mascot-loader", className)}
    >
      <g className="openui-agent-mascot-loader__body" style={{ animationDelay: `${delay}ms` }}>
        <MascotArt />
      </g>
    </svg>
  );
};

import clsx from "clsx";
import { MASCOT_BODY_PATHS, MASCOT_EYES, MASCOT_VIEWBOX } from "./mascotPaths";

/** The mascot's paths: body outline, then the eyes and their glints on top. */
export const MascotArt = () => (
  <>
    {MASCOT_BODY_PATHS.map((p, i) => (
      <path key={i} d={p.d} fill={p.fill} />
    ))}
    {MASCOT_EYES.map((eye, i) => (
      <g key={i}>
        <path d={eye.eye} fill="black" />
        <path d={eye.glint} fill="white" />
      </g>
    ))}
  </>
);

/**
 * The OpenUI mascot at full strength, standing still. Decorative only. For the
 * pulsing grey loader, use {@link MascotLoader}.
 */
export const Mascot = ({ size = 28, className }: { size?: number; className?: string }) => (
  <svg
    viewBox={MASCOT_VIEWBOX}
    width={size}
    height={(size * 161) / 201}
    fill="none"
    aria-hidden="true"
    className={clsx("openui-agent-mascot", className)}
  >
    <MascotArt />
  </svg>
);

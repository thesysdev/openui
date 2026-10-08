import clsx from "clsx";
import { MascotLoader } from "./MascotLoader";

/**
 * Loading state for AgentInterface surfaces: the OpenUI mascot loader, centred
 * in whatever panel hosts it (min 280px tall), with a contextual label for
 * screen readers. Holds still under `prefers-reduced-motion`.
 *
 * The label is required on purpose — every loading surface should say what is
 * actually happening ("Loading artifacts…"), never a bare "Loading…".
 */
export const AmbientLoader = ({ label, className }: { label: string; className?: string }) => (
  <div className={clsx("openui-agent-ambient-loader", className)} role="status" aria-live="polite">
    <span className="openui-agent-ambient-loader__status">
      <MascotLoader size={40} />
      {/* Announced, not shown: the mascot alone is the visible state. */}
      <span className="openui-agent-ambient-loader__label">{label}</span>
    </span>
  </div>
);

import { useRef } from "react";
import { FadeFollower, springPresets, useSeededAim, useSpring } from "../spring";

// Ported from react-ui's LineDotCrosshair (components/Charts/shared/cartesian/
// LineDotCrosshair.tsx): the crosshair line and the dots share
// springPresets.crosshair so they move as one.

export interface CrosshairDot {
  key: string;
  color: string;
  /** Where the dot sits if its series' path can't be found. */
  fallbackY: number;
  opacity?: number;
  /** The series' rendered line, so the dot can ride the real curve. */
  getPath: () => SVGPathElement | null;
}

/**
 * The hover crosshair and its active dots. Always mounted (the chart renders it
 * with a possibly-hidden point), so the springs persist: the crosshair glides
 * to the hovered point instead of snapping, fades in and out instead of
 * popping, and each dot travels ALONG its series' line (sampled with
 * `getPointAtLength`) instead of cutting a straight chord across the curve.
 */
export function ChartCrosshair({
  x,
  visible,
  top,
  bottom,
  dots,
  classPrefix,
}: {
  x: number;
  visible: boolean;
  top: number;
  bottom: number;
  dots: CrosshairDot[];
  /** The chart's class prefix: draws `${classPrefix}-crosshair-line` and `-active-dot`. */
  classPrefix: string;
}) {
  return (
    <g className={`${classPrefix}-crosshair`} aria-hidden>
      <FadeFollower x={x} visible={visible}>
        <line className={`${classPrefix}-crosshair-line`} x1={0} x2={0} y1={top} y2={bottom} />
      </FadeFollower>
      {dots.map(({ key, ...dot }) => (
        <ActiveDot
          key={key}
          targetX={x}
          visible={visible && Number.isFinite(dot.fallbackY)}
          classPrefix={classPrefix}
          {...dot}
        />
      ))}
    </g>
  );
}

// lengthAtX runs on every aim, so it stops at half a pixel of arc-length
// precision and memoizes per path while neither the geometry nor the target
// x changed.
const lengthAtXCache = new WeakMap<SVGPathElement, { d: string | null; x: number; len: number }>();

/** Arc length on a left-to-right path where the path reaches `x`. */
function lengthAtX(path: SVGPathElement, x: number): number {
  const d = path.getAttribute("d");
  const cached = lengthAtXCache.get(path);
  if (cached && cached.d === d && cached.x === x) return cached.len;
  const total = path.getTotalLength();
  if (total === 0) return 0;
  let lo = 0;
  let hi = total;
  while (hi - lo > 0.5) {
    const mid = (lo + hi) / 2;
    if (path.getPointAtLength(mid).x < x) lo = mid;
    else hi = mid;
  }
  const len = (lo + hi) / 2;
  lengthAtXCache.set(path, { d, x, len });
  return len;
}

function ActiveDot({
  targetX,
  fallbackY,
  visible,
  color,
  opacity = 1,
  classPrefix,
  getPath,
}: Omit<CrosshairDot, "key"> & { targetX: number; visible: boolean; classPrefix: string }) {
  const groupRef = useRef<SVGGElement>(null);
  const pathRef = useRef<SVGPathElement | null>(null);

  const write = (px: number, py: number) => {
    if (groupRef.current) groupRef.current.style.transform = `translate(${px}px, ${py}px)`;
  };

  // The spring's value is the arc length along the line; mapping it through
  // getPointAtLength each frame makes the dot ride the curve.
  const spring = useSpring(springPresets.crosshair, (len) => {
    const p = pathRef.current?.getPointAtLength(len);
    if (p) write(p.x, p.y);
  });
  useSeededAim(visible, [targetX, fallbackY], (first) => {
    pathRef.current = getPath();
    const path = pathRef.current;
    if (!path) {
      write(targetX, fallbackY);
      return false;
    }
    const len = lengthAtX(path, targetX);
    if (first) spring.jump(len);
    else spring.set(len);
    return true;
  });

  return (
    <g ref={groupRef} style={{ opacity: visible ? opacity : 0, transition: "opacity 0.12s ease" }}>
      <circle r={5.5} className={`${classPrefix}-active-dot-outer`} />
      <circle r={3.5} fill={color} className={`${classPrefix}-active-dot-inner`} />
    </g>
  );
}

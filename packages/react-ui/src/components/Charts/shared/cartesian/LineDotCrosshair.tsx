import type { ScaleLinear, ScalePoint } from "d3-scale";
import React, { useCallback, useId, useRef } from "react";
import { FadeFollower, springPresets, useSeededAim, useSpring } from "../core/spring";

// Crosshair line + dots share springPresets.crosshair so they move as one;
// the highlight band uses springPresets.highlight (trails a touch behind).

interface LineDotCrosshairProps {
  hoveredIndex: number | null;
  xScale: ScalePoint<string>;
  yScale: ScaleLinear<number, number>;
  data: Array<Record<string, string | number>>;
  dataKeys: string[];
  categoryKey: string;
  colors: Record<string, string>;
  chartHeight: number;
  getYValue: (row: Record<string, string | number>, key: string, seriesIndex: number) => number;
  classPrefix: string;
  /** Render the vertical crosshair line. Default true. */
  crosshair?: boolean;
  /** Render the traveling highlight segment. Default true. */
  highlight?: boolean;
  /** Render the active dots that ride the curve. Default true. */
  activeDots?: boolean;
}

/**
 * The hover crosshair + active dots. Kept mounted (the parent always renders it
 * with a possibly-null `hoveredIndex`), so the followers' springs persist and the
 * crosshair/dots GLIDE to the hovered point instead of snapping. The crosshair
 * line slides in x; the dots travel ALONG the series' line path (sampled with
 * `getPointAtLength`) so they ride the real curve — natural, step, etc. — instead
 * of cutting a straight chord between points.
 */
export const LineDotCrosshair: React.FC<LineDotCrosshairProps> = ({
  hoveredIndex,
  xScale,
  yScale,
  data,
  dataKeys,
  categoryKey,
  colors,
  chartHeight,
  getYValue,
  classPrefix,
  crosshair = true,
  highlight = true,
  activeDots = true,
}) => {
  const groupRef = useRef<SVGGElement>(null);

  // Find the i-th rendered series line path (the real curve) within this chart's
  // SVG. LineSeries draws `${classPrefix}-line`; AreaSeries draws
  // `${classPrefix}-area-line`. They render in dataKeys order, so index lines up.
  const getLinePath = useCallback(
    (seriesIndex: number): SVGPathElement | null => {
      const svg = groupRef.current?.ownerSVGElement;
      if (!svg) return null;
      const paths = svg.querySelectorAll<SVGPathElement>(
        `.${classPrefix}-line, .${classPrefix}-area-line`,
      );
      return paths[seriesIndex] ?? null;
    },
    [classPrefix],
  );

  const visible = hoveredIndex !== null && hoveredIndex >= 0 && hoveredIndex < data.length;
  const row = visible ? data[hoveredIndex]! : undefined;
  const x = row ? (xScale(String(row[categoryKey])) ?? 0) : 0;

  return (
    <g ref={groupRef} className={`${classPrefix}-crosshair`}>
      {/* Rendered first → sits under the crosshair line + dots. */}
      {highlight && (
        <HighlightLayer
          hoveredIndex={hoveredIndex}
          visible={visible}
          data={data}
          xScale={xScale}
          categoryKey={categoryKey}
          dataKeys={dataKeys}
          colors={colors}
          chartHeight={chartHeight}
          getPath={getLinePath}
        />
      )}
      {crosshair && (
        <FadeFollower x={x} visible={visible}>
          <line className={`${classPrefix}-crosshair-line`} x1={0} x2={0} y1={0} y2={chartHeight} />
        </FadeFollower>
      )}
      {activeDots &&
        dataKeys.map((key, seriesIndex) => (
          <ActiveDot
            key={key}
            targetX={x}
            fallbackY={row ? yScale(getYValue(row, key, seriesIndex)) : 0}
            visible={visible}
            color={colors[key] ?? "#000"}
            classPrefix={classPrefix}
            getPath={() => getLinePath(seriesIndex)}
          />
        ))}
    </g>
  );
};

// ── active dot: springs its position ALONG the series line path ───────────────

// lengthAtX runs on every aim, and under streaming an aim lands every data
// tick (the hovered row's y changes) — so its getPointAtLength cost is a
// per-frame cost while hovering a live chart. Two containments:
//  • the bisection stops at half a pixel of arc-length precision (was a fixed
//    22 iterations ≈ micro-pixel precision — ~2× the needed work);
//  • a per-path memo skips the search entirely when neither the geometry nor
//    the target x changed since the last aim (re-renders without data change).
const lengthAtXCache = new WeakMap<SVGPathElement, { d: string | null; x: number; len: number }>();

/** Arc-length on a (left-to-right monotonic-x) path where the path reaches `x`. */
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
  classPrefix,
  getPath,
}: {
  targetX: number;
  fallbackY: number;
  visible: boolean;
  color: string;
  classPrefix: string;
  getPath: () => SVGPathElement | null;
}) {
  const gRef = useRef<SVGGElement>(null);
  const pathRef = useRef<SVGPathElement | null>(null);

  const write = (px: number, py: number) => {
    if (gRef.current) {
      gRef.current.style.transform = `translate(${px}px, ${py}px)`;
    }
  };

  // The spring's value is the arc-length along the line path; mapping it through
  // getPointAtLength each frame makes the dot ride the curve.
  const spring = useSpring(springPresets.crosshair, (len) => {
    const p = pathRef.current?.getPointAtLength(len);
    if (p) write(p.x, p.y);
  });
  useSeededAim(visible, [targetX, fallbackY], (first) => {
    pathRef.current = getPath();
    const path = pathRef.current;
    if (!path) {
      // No path found (shouldn't happen for line/area) — sit at the point. The
      // false return skips seeding, so if this happens on FIRST show the
      // eventual first real aim still jumps (mid-session it glides, as before).
      write(targetX, fallbackY);
      return false;
    }
    const targetLen = lengthAtX(path, targetX);
    if (first) spring.jump(targetLen);
    else spring.set(targetLen);
    return true;
  });

  return (
    <g ref={gRef} style={{ opacity: visible ? 1 : 0, transition: "opacity 0.12s ease" }}>
      <circle cx={0} cy={0} r={4} className={`${classPrefix}-active-dot-outer`} />
      <circle cx={0} cy={0} r={2} fill={color} className={`${classPrefix}-active-dot-inner`} />
    </g>
  );
}

// ── highlight segment: a brighter re-stroke of each line, clipped to a band ────
// On hover, the slice of the line spanning ONE data point either side of the
// hovered point (`[idx-1, idx+1]`) lights up and travels along the real curve.
// One shared clip band (x + width spring); each series re-strokes its own real
// `d` (read from the rendered path), so the glow traces the actual curve.

function HighlightLayer({
  hoveredIndex,
  visible,
  data,
  xScale,
  categoryKey,
  dataKeys,
  colors,
  chartHeight,
  getPath,
}: {
  hoveredIndex: number | null;
  visible: boolean;
  data: Array<Record<string, string | number>>;
  xScale: ScalePoint<string>;
  categoryKey: string;
  dataKeys: string[];
  colors: Record<string, string>;
  chartHeight: number;
  getPath: (seriesIndex: number) => SVGPathElement | null;
}) {
  const clipId = useId();
  const rectRef = useRef<SVGRectElement>(null);
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);

  // One band for every series: x = left edge, width = span — both spring.
  const xSpring = useSpring(springPresets.highlight, (v) => {
    rectRef.current?.setAttribute("x", String(v));
  });
  const wSpring = useSpring(springPresets.highlight, (v) => {
    rectRef.current?.setAttribute("width", String(v));
  });
  useSeededAim(visible && hoveredIndex !== null, [hoveredIndex], (first) => {
    const startIdx = Math.max(0, hoveredIndex! - 1);
    const endIdx = Math.min(data.length - 1, hoveredIndex! + 1);
    const startX = xScale(String(data[startIdx]?.[categoryKey])) ?? 0;
    const endX = xScale(String(data[endIdx]?.[categoryKey])) ?? 0;
    const bandX = startX;
    const bandW = Math.max(0, endX - startX);
    // Re-stroke each series with its real line `d`, clipped to the band.
    dataKeys.forEach((_, i) => {
      const real = getPath(i);
      const hp = pathRefs.current[i];
      if (real && hp) hp.setAttribute("d", real.getAttribute("d") ?? "");
    });
    if (first) {
      xSpring.jump(bandX);
      wSpring.jump(bandW);
    } else {
      xSpring.set(bandX);
      wSpring.set(bandW);
    }
  });

  return (
    <g aria-hidden="true" style={{ opacity: visible ? 1 : 0, transition: "opacity 0.15s ease" }}>
      <defs>
        <clipPath id={clipId}>
          {/* x + width set imperatively by the springs; width 0 until active. */}
          <rect ref={rectRef} y={0} height={chartHeight} />
        </clipPath>
      </defs>
      {dataKeys.map((key, i) => (
        <path
          key={key}
          // d set imperatively from the real line; no React `d` prop to fight it.
          ref={(el) => {
            pathRefs.current[i] = el;
          }}
          clipPath={`url(#${clipId})`}
          fill="none"
          stroke={colors[key] ?? "#000"}
          strokeWidth={3.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </g>
  );
}

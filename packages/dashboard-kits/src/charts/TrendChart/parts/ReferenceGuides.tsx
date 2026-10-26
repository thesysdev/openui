import type { RefObject } from "react";
import { KIT_CHART_PREFIX } from "../../utils/constants";

const P = `${KIT_CHART_PREFIX}-trend-chart`;

export interface GuideRefs {
  target: RefObject<SVGLineElement | null>;
  band: RefObject<SVGRectElement | null>;
}

/** Band rectangle from the two band edges' y positions. */
function bandRect(from: number, to: number) {
  return { y: Math.min(from, to), height: Math.abs(from - to) };
}

/**
 * Moves the guides to animated positions on a morph tick. `guides` is the
 * trend morph's guide block: [target y, band-from y, band-to y].
 */
export function writeGuides(refs: GuideRefs, guides: ArrayLike<number>) {
  const [targetY, from, to] = [guides[0]!, guides[1]!, guides[2]!];
  refs.target.current?.setAttribute("y1", String(targetY));
  refs.target.current?.setAttribute("y2", String(targetY));
  const band = bandRect(from, to);
  refs.band.current?.setAttribute("y", String(band.y));
  refs.band.current?.setAttribute("height", String(band.height));
}

/**
 * A benchmark range shaded across the plot and a goal drawn as a dashed line.
 * Their names live in the legend, so nothing here can collide with the data.
 * Their positions ride the trend's data morph, so they glide with the lines.
 */
export function ReferenceGuides({
  refs,
  guides,
  hasBand,
  hasTarget,
  left,
  right,
}: {
  refs: GuideRefs;
  guides: ArrayLike<number>;
  hasBand: boolean;
  hasTarget: boolean;
  left: number;
  right: number;
}) {
  const band = bandRect(guides[1]!, guides[2]!);
  return (
    <g className={`${P}-guides`}>
      {hasBand && (
        <rect ref={refs.band} className={`${P}-band`} x={left} width={right - left} {...band} />
      )}
      {hasTarget && (
        <line
          ref={refs.target}
          className={`${P}-target`}
          x1={left}
          x2={right}
          y1={guides[0]}
          y2={guides[0]}
        />
      )}
    </g>
  );
}

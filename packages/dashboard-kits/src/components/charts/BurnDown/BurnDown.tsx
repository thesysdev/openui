import clsx from "clsx";
import { scaleLinear } from "d3-scale";
import { line } from "d3-shape";
import { useMemo } from "react";
import { useContainerSize } from "../../../hooks";
import { KIT_CHART_PREFIX } from "../utils/constants";
import { burnGeometry, type Point } from "./burnGeometry";
import type { BurnDownProps } from "./types";

const P = `${KIT_CHART_PREFIX}-burn`;
const PAD = 3;

/**
 * A commit's burn-down in a table row: credits used so far (solid), where
 * this pace ends at renewal (dotted), and the straight line through the term
 * the commit assumes (faint). d3 linear scales at the container's real width;
 * the geometry is pure (burnGeometry.ts).
 */
export function BurnDown({
  height = 44,
  className,
  status,
  overIsBad = false,
  ...input
}: BurnDownProps) {
  const [ref, size] = useContainerSize<HTMLDivElement>(160, height);
  const width = size.width;
  const paths = useMemo(() => {
    const g = burnGeometry(input);
    const x = scaleLinear()
      .domain([0, 1])
      .range([PAD, width - PAD]);
    const y = scaleLinear()
      .domain([0, g.top])
      .range([height - PAD, PAD]);
    const d = line<Point>()
      .x((p) => x(p[0]))
      .y((p) => y(p[1]));
    const now = g.used[g.used.length - 1]!;
    return {
      used: d(g.used) ?? "",
      ideal: d(g.ideal) ?? "",
      projected: d(g.projected) ?? "",
      dot: [x(now[0]), y(now[1])] as const,
      today: x(now[0]),
    };
    // input is a fresh object each render; its fields are what matter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input.burn.join(","), input.committed, input.elapsed, input.projected, width, height]);
  return (
    <div
      ref={ref}
      className={clsx(
        P,
        `${P}--${status}`,
        overIsBad && status === "over" && `${P}--bad`,
        className,
      )}
      style={{ height }}
    >
      <svg width={width} height={height} aria-hidden>
        <line className={`${P}-today`} x1={paths.today} x2={paths.today} y1={0} y2={height} />
        <path className={`${P}-ideal`} d={paths.ideal} />
        <path className={`${P}-projected`} d={paths.projected} />
        <path className={`${P}-used`} d={paths.used} />
        <circle className={`${P}-dot`} cx={paths.dot[0]} cy={paths.dot[1]} r={2.5} />
      </svg>
    </div>
  );
}

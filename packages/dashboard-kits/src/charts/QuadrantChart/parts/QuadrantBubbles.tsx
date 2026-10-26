import clsx from "clsx";
import { memo, useRef } from "react";
import { useIsomorphicLayoutEffect } from "../../../core/hooks";
import { springPresets, useDataMorph } from "../../shared/spring";
import { KIT_CHART_PREFIX } from "../../utils/constants";
import { BUBBLE_STRIDE, type LabelPlacement } from "../quadrantGeometry";

const P = `${KIT_CHART_PREFIX}-quadrant`;
/** Every bubble's hover target is at least this radius, however small the bubble. */
const MIN_HIT_RADIUS = 12;

/**
 * One bubble per point with its label. Positions and sizes ride one spring
 * data morph over the packed bubble vector, so a filter glides every bubble
 * and label to its new place together; a resize snaps. Hovering one fades the
 * rest.
 */
export const QuadrantBubbles = memo(function QuadrantBubbles({
  flat,
  names,
  colors,
  anchors,
  hover,
  onHover,
  layoutKey,
  isAnimationActive,
}: {
  /** Target geometry, `BUBBLE_STRIDE` scalars per bubble (see `packBubbles`). */
  flat: Float64Array;
  names: string[];
  colors: string[];
  anchors: (LabelPlacement["anchor"] | undefined)[];
  hover: number | null;
  onHover: (index: number) => void;
  layoutKey: string;
  isAnimationActive: boolean;
}) {
  const dotRefs = useRef<(SVGCircleElement | null)[]>([]);
  const hitRefs = useRef<(SVGCircleElement | null)[]>([]);
  const labelRefs = useRef<(SVGTextElement | null)[]>([]);

  const aim = useDataMorph(springPresets.dataMorph, (values) => {
    for (let i = 0; i * BUBBLE_STRIDE < values.length; i++) {
      const [cx, cy, r, lx, ly] = values.subarray(i * BUBBLE_STRIDE, (i + 1) * BUBBLE_STRIDE);
      for (const el of [dotRefs.current[i], hitRefs.current[i]]) {
        el?.setAttribute("cx", String(cx));
        el?.setAttribute("cy", String(cy));
      }
      dotRefs.current[i]?.setAttribute("r", String(r));
      hitRefs.current[i]?.setAttribute("r", String(Math.max(MIN_HIT_RADIUS, r! + 4)));
      labelRefs.current[i]?.setAttribute("x", String(lx));
      labelRefs.current[i]?.setAttribute("y", String(ly));
    }
  });
  // The first aim and any resize snap; only data changes glide.
  const lastLayout = useRef<string | null>(null);
  useIsomorphicLayoutEffect(() => {
    const snap = !isAnimationActive || lastLayout.current !== layoutKey;
    lastLayout.current = layoutKey;
    aim(flat, snap, isAnimationActive);
  }, [flat, layoutKey, isAnimationActive, aim]);

  return (
    <g className={`${P}-bubbles`}>
      {names.map((name, i) => {
        const [cx, cy, r, lx, ly] = flat.subarray(i * BUBBLE_STRIDE, (i + 1) * BUBBLE_STRIDE);
        const anchor = anchors[i];
        return (
          <g
            key={name}
            className={clsx(`${P}-item`, isAnimationActive && `${P}-item--animated`)}
            onPointerEnter={() => onHover(i)}
            opacity={hover != null && hover !== i ? 0.4 : 1}
            style={{ animationDelay: `${i * 35}ms` }}
          >
            <circle
              ref={(el) => {
                dotRefs.current[i] = el;
              }}
              cx={cx}
              cy={cy}
              r={r}
              fill={colors[i]}
              className={`${P}-dot`}
            />
            <circle
              ref={(el) => {
                hitRefs.current[i] = el;
              }}
              cx={cx}
              cy={cy}
              r={Math.max(MIN_HIT_RADIUS, r! + 4)}
              fill="transparent"
            />
            {anchor && (
              <text
                ref={(el) => {
                  labelRefs.current[i] = el;
                }}
                x={lx}
                y={ly}
                textAnchor={anchor}
                className={`${P}-label`}
              >
                {name}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
});

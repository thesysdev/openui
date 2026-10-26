import clsx from "clsx";
import { scaleBand } from "d3-scale";
import { useCallback, useId, useMemo } from "react";
import { useChartHover, useContainerSize } from "../../core/hooks";
import { ChartEmpty } from "../shared/ChartEmpty";
import { FadeFollower } from "../shared/spring";
import { KIT_CHART_PREFIX } from "../utils/constants";
import { findBandIndex } from "../utils/mouseUtils";
import { statusCounts, TRACKER_STATUS_LABEL } from "./trackerUtils";
import type { TrackerProps } from "./types";

const P = `${KIT_CHART_PREFIX}-tracker`;
const HEIGHT = 36;
/** Gap between blocks in px, however many there are. */
const GAP = 3;
/** The hover ring sits this far outside the block. */
const RING = 3;

/**
 * A strip of blocks, one per day or check, each colored by whether it met its
 * target (Tremor's tracker pattern), laid out on a d3 band scale. Hovering a
 * block reads out its figure, fades the rest, and draws a ring that glides
 * from block to block on the crosshair spring; the footer counts each status.
 */
export function Tracker(props: TrackerProps) {
  if (props.items.length === 0) {
    return <ChartEmpty prefix={P} className={props.className} />;
  }
  return <TrackerImpl {...props} />;
}

function TrackerImpl({ items, summary, className }: TrackerProps) {
  const [frameRef, size] = useContainerSize<HTMLDivElement>(480, HEIGHT);
  const patternId = `${P}-none-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const n = items.length;
  const width = Math.max(size.width, n * 3);

  const x = useMemo(() => {
    const step = width / n;
    return scaleBand<number>()
      .domain(Array.from({ length: n }, (_, i) => i))
      .range([0, width])
      .paddingInner(Math.min(0.5, GAP / step));
  }, [n, width]);
  const findIndex = useCallback((px: number) => findBandIndex(x, px), [x]);
  const hover = useChartHover(n);
  const hovered = hover.hoveredIndex;
  const shown = hover.restingIndex ?? 0;
  const readout = hovered != null ? items[hovered] : undefined;

  return (
    <div className={clsx(P, className)}>
      <div className={`${P}-top`}>
        {summary && <span className={`${P}-summary`}>{summary}</span>}
        <span className={`${P}-readout`} aria-live="polite">
          {readout ? (
            <>
              <strong>{readout.label}</strong>
              {readout.value && <> · {readout.value}</>}
              {readout.detail && <span className="kit-muted"> · {readout.detail}</span>}
            </>
          ) : (
            <span className="kit-muted">Hover a day for its figure</span>
          )}
        </span>
      </div>
      <div
        ref={frameRef}
        className={`${P}-frame`}
        tabIndex={0}
        role="img"
        aria-label={`${n} days from ${items[0]!.label} to ${items[n - 1]!.label}. Use the arrow keys to read each day.`}
        {...hover.createHandlers(findIndex)}
      >
        <svg width={width} height={HEIGHT} className={`${P}-svg`}>
          <defs>
            <pattern
              id={patternId}
              width={6}
              height={6}
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <rect width={6} height={6} className={`${P}-hatch-ground`} />
              <rect width={2} height={6} className={`${P}-hatch-line`} />
            </pattern>
          </defs>
          <g className={clsx(`${P}-blocks`, hovered != null && `${P}-blocks--hovering`)}>
            {items.map((item, i) => (
              <rect
                key={`${item.label}-${i}`}
                x={x(i)}
                width={x.bandwidth()}
                height={HEIGHT}
                rx={Math.min(3, x.bandwidth() / 2)}
                className={clsx(
                  `${P}-block ${P}-block--${item.status}`,
                  i === hovered && `${P}-block--active`,
                )}
                fill={item.status === "none" ? `url(#${patternId})` : undefined}
                style={{ animationDelay: `${Math.round((i / n) * 240)}ms` }}
              >
                <title>{`${item.label}: ${item.value ?? TRACKER_STATUS_LABEL[item.status]}`}</title>
              </rect>
            ))}
          </g>
          <FadeFollower x={x(shown) ?? 0} visible={hovered != null}>
            <rect
              x={-RING}
              y={-RING}
              width={x.bandwidth() + RING * 2}
              height={HEIGHT + RING * 2}
              rx={5}
              className={`${P}-ring`}
            />
          </FadeFollower>
        </svg>
      </div>
      <div className={`${P}-foot`}>
        <span>{items[0]!.label}</span>
        <span className={`${P}-counts`}>
          {statusCounts(items).map((c) => (
            <span key={c.status} className={`${P}-count`}>
              <i className={`${P}-key ${P}-key--${c.status}`} />
              {c.label} {c.count}
            </span>
          ))}
        </span>
        <span>{items[n - 1]!.label}</span>
      </div>
    </div>
  );
}

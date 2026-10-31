"use client";

import clsx from "clsx";
import type { Arc, PieArcDatum } from "d3-shape";
import type { CSSProperties } from "react";
import React from "react";
import type { CategoricalSlice } from "../../hooks";
import { useIndexedClickHandler } from "../../hooks/core/useIndexedClickHandler";
import { springPresets, useIsomorphicLayoutEffect, useTranslate } from "../../shared/core/spring";
import { entranceProps } from "../../utils/entranceUtils";
import { getSliceStyle, POLAR_HOVER_TRANSITION } from "../../utils/polarUtils";
import { names, pieChartStyles } from "../pieChart.styles";

// How far the hovered wedge pops out along its radial bisector (px).
const PIE_HOVER_OFFSET = 8;

// The donut's track wedges take their sunk fill from the stylesheet.

// Outward direction of a slice. d3 angles start at 12 o'clock and increase clockwise,
// so the radial bisector points to (sin(mid), -cos(mid)).
function sliceOffset(startAngle: number, endAngle: number, distance: number) {
  // A near-full-circle slice has no meaningful bisector — don't slide it in an arbitrary
  // direction; getSliceStyle still conveys the hover.
  if (endAngle - startAngle >= 2 * Math.PI - 1e-9) return { x: 0, y: 0 };
  const mid = (startAngle + endAngle) / 2;
  return { x: Math.sin(mid) * distance, y: -Math.cos(mid) * distance };
}

interface PieSlicesProps<T> {
  arcs: PieArcDatum<CategoricalSlice>[];
  arcGenerator: Arc<unknown, PieArcDatum<CategoricalSlice>>;
  /** Donut: the sunk-colored track wedge drawn under each band segment. */
  trackArcGenerator?: Arc<unknown, PieArcDatum<CategoricalSlice>>;
  /** Donut: the hover area of a slice, band and track together. Default: the slice itself. */
  hitArcGenerator?: Arc<unknown, PieArcDatum<CategoricalSlice>>;
  slices: CategoricalSlice[];
  hoveredIndex: number | null;
  /** Play the entrance animation (pre-folded with ¬printing at the entry). */
  entrance: boolean;
  /** Render the inert print path: no hitbox, no spring, no entrance. */
  staticRender: boolean;
  data: T[];
  onMouseMove: (event: React.MouseEvent, index: number) => void;
  onMouseLeave: () => void;
  onClick?: (row: T, index: number) => void;
}

export function PieSlices<T>({
  arcs,
  arcGenerator,
  trackArcGenerator,
  hitArcGenerator,
  slices,
  hoveredIndex,
  entrance,
  staticRender,
  data,
  onMouseMove,
  onMouseLeave,
  onClick,
}: PieSlicesProps<T>) {
  const styles = pieChartStyles;
  const handleClick = useIndexedClickHandler(data, onClick);

  return (
    <g className={clsx(styles.group, names.group)}>
      {arcs.map((arc, i) => {
        const slice = slices[i];
        if (!slice) return null;
        const pathD = arcGenerator(arc);
        if (!pathD) return null;
        const trackD = trackArcGenerator?.(arc) ?? undefined;
        const sliceStyle = getSliceStyle(i, hoveredIndex);

        // Print: inert paths (the donut adds its track), handlers on them, no
        // hitbox, no spring.
        // Branching here (rather than inside <Slice>) keeps the spring
        // machinery off the print path entirely. The hover pop-out spring is
        // NOT gated by isAnimationActive — hover glide is interaction
        // feedback, not decoration (decision D-1); only the entrance is.
        if (staticRender) {
          const staticProps = {
            style: {
              "--_openui-pie-chart-slice-fill-opacity": sliceStyle.fillOpacity,
              "--_openui-pie-chart-slice-filter": sliceStyle.filter,
              "--_openui-pie-chart-slice-cursor": onClick ? "pointer" : undefined,
              "--_openui-pie-chart-slice-transition": POLAR_HOVER_TRANSITION,
            } as CSSProperties,
            onMouseMove: (e: React.MouseEvent) => onMouseMove(e, i),
            onMouseLeave,
            onClick: () => handleClick(i),
          };
          return (
            <React.Fragment key={slice.label}>
              {trackD && (
                <path d={trackD} className={clsx(styles.track, names.track)} {...staticProps} />
              )}
              <path
                className={clsx(styles.slice, names.slice)}
                d={pathD}
                fill={slice.color}
                {...staticProps}
              />
            </React.Fragment>
          );
        }

        return (
          <Slice
            key={slice.label}
            pathD={pathD}
            trackD={trackD}
            hitD={hitArcGenerator?.(arc) ?? pathD}
            color={slice.color}
            sliceStyle={sliceStyle}
            hovered={hoveredIndex === i}
            offset={sliceOffset(arc.startAngle, arc.endAngle, PIE_HOVER_OFFSET)}
            entrance={entrance}
            animationDelay={i * 50}
            clickable={!!onClick}
            onMouseMove={(e) => onMouseMove(e, i)}
            onMouseLeave={onMouseLeave}
            onClick={() => handleClick(i)}
          />
        );
      })}
    </g>
  );
}

interface SliceProps {
  pathD: string;
  trackD?: string;
  hitD: string;
  color: string;
  sliceStyle: React.CSSProperties;
  hovered: boolean;
  offset: { x: number; y: number };
  entrance: boolean;
  animationDelay: number;
  clickable: boolean;
  onMouseMove: (event: React.MouseEvent) => void;
  onMouseLeave: () => void;
  onClick: () => void;
}

/**
 * One animated pie wedge. The hovered wedge GLIDES outward along its radial bisector via
 * its own spring; every other wedge always springs back to home, so a legend toggle that
 * shifts the positional `hovered` can never leave a wedge stuck popped-out. An invisible
 * hitbox holds the base geometry under the cursor while the visible wedge moves; the
 * spring's `translate` lives on a wrapper <g> so it composes with — rather than fights —
 * the CSS entrance `scale` keyframe (which uses `forwards` and would otherwise override
 * an inline transform on the same element). Mounted whenever not printing — the spring
 * is hover feedback, independent of isAnimationActive; `entrance` only gates the
 * keyframe class. The print path is a plain <path> in PieSlices (no spring).
 */
function Slice({
  pathD,
  trackD,
  hitD,
  color,
  sliceStyle,
  hovered,
  offset,
  entrance,
  animationDelay,
  clickable,
  onMouseMove,
  onMouseLeave,
  onClick,
}: SliceProps) {
  const styles = pieChartStyles;
  const follow = useTranslate(springPresets.popOut);

  // Glide to the offset when hovered, always glide home otherwise (rest IS home, so no
  // seeded jump — the first hover is the pop-out itself).
  useIsomorphicLayoutEffect(() => {
    follow.to(hovered ? offset.x : 0, hovered ? offset.y : 0);
  }, [hovered, offset.x, offset.y]);

  const baseStyle: React.CSSProperties = {
    ...sliceStyle,
    transition: POLAR_HOVER_TRANSITION,
  };

  const { className: entranceClass, animationDelay: entranceDelay } = entranceProps(
    entrance,
    clsx(styles.sliceIsAnimationActive, names.sliceIsAnimationActive),
    animationDelay,
  );

  return (
    <g className={clsx(styles.group, names.group)}>
      {/* Invisible hitbox: base geometry, owns the pointer, never moves. fill MUST stay
          `transparent` (a painted region) — `none` would make the interior non-painted
          and silently kill hover under the default `visiblePainted`. */}
      <path
        className={clsx(styles.hitbox, names.hitbox)}
        d={hitD}
        fill="transparent"
        style={
          {
            "--_openui-pie-chart-hitbox-pointer-events": "all",
            "--_openui-pie-chart-hitbox-cursor": clickable ? "pointer" : undefined,
          } as CSSProperties
        }
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        onClick={onClick}
      />
      {/* Visible wedge: spring-translated; pointer-events:none on the wrapper falls
          through to the hitbox so hover stays anchored to the un-popped footprint. */}
      <g
        className={clsx(styles.group, names.group)}
        ref={follow.bind}
        style={{ "--_openui-pie-chart-group-pointer-events": "none" } as CSSProperties}
      >
        {trackD && (
          <path
            d={trackD}
            className={clsx(styles.track, names.track, entranceClass)}
            style={
              {
                "--_openui-pie-chart-slice-fill-opacity": baseStyle.fillOpacity,
                "--_openui-pie-chart-slice-filter": baseStyle.filter,
                "--_openui-pie-chart-slice-transition": baseStyle.transition,
                "--_openui-pie-chart-slice-animation-delay": entranceDelay,
              } as CSSProperties
            }
          />
        )}
        <path
          d={pathD}
          fill={color}
          className={clsx(styles.slice, names.slice, entranceClass)}
          style={
            {
              "--_openui-pie-chart-slice-fill-opacity": baseStyle.fillOpacity,
              "--_openui-pie-chart-slice-filter": baseStyle.filter,
              "--_openui-pie-chart-slice-transition": baseStyle.transition,
              "--_openui-pie-chart-slice-animation-delay": entranceDelay,
            } as CSSProperties
          }
        />
      </g>
    </g>
  );
}

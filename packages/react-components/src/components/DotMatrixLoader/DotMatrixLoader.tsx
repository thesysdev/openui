"use client";

import clsx from "clsx";
import { useEffect, useRef, type CSSProperties } from "react";
import { dotMatrixLoaderStyles, names } from "./dotMatrixLoader.styles";

/** Time for each trail to complete one revolution of its ring. */
const REVOLUTION_MS = 1400;
const MIN_OPACITY = 0.14;
/** Trail length as a fraction of the ring — same visual proportion on both rings. */
const TRAIL_LENGTH = 0.28;

const createClockwiseRing = (
  gridSize: number,
  inset: number,
): readonly (readonly [number, number])[] => {
  const start = inset;
  const end = gridSize - inset - 1;
  const ring: [number, number][] = [];

  for (let col = start; col <= end; col++) ring.push([start, col]);
  for (let row = start + 1; row <= end; row++) ring.push([row, end]);
  for (let col = end - 1; col >= start; col--) ring.push([end, col]);
  for (let row = end - 1; row > start; row--) ring.push([row, start]);

  return ring;
};

const RINGS = {
  4: {
    outer: createClockwiseRing(4, 0),
    inner: createClockwiseRing(4, 1),
  },
  5: {
    outer: createClockwiseRing(5, 0),
    inner: createClockwiseRing(5, 1),
  },
} as const;

/**
 * Dot-matrix loader with a 5×5 default grid and a 4×4 compact grid. Two comet
 * trails orbit in lockstep — one clockwise around the perimeter, one
 * counterclockwise around the inner ring.
 */
export type DotMatrixLoaderVariant = "default" | "compact";

export const DotMatrixLoader = ({
  className,
  size,
  variant = "default",
}: {
  className?: string;
  /** Overrides the variant's total width/height in px. */
  size?: number;
  variant?: DotMatrixLoaderVariant;
}) => {
  const styles = dotMatrixLoaderStyles;
  const dotsRef = useRef<Map<string, HTMLSpanElement>>(new Map());
  const isCompact = variant === "compact";
  const gridSize = isCompact ? 4 : 5;
  const rings = RINGS[gridSize];
  const resolvedSize = size ?? (isCompact ? 24 : 36);

  useEffect(() => {
    const dots = dotsRef.current;
    dots.forEach((dot) => {
      dot.style.setProperty("--_openui-dot-matrix-loader-dot-opacity", String(MIN_OPACITY));
    });

    const paintRing = (ring: readonly (readonly [number, number])[], head: number) => {
      const tail = ring.length * TRAIL_LENGTH;
      for (let i = 0; i < ring.length; i++) {
        const cell = ring[i];
        const dot = cell && dots.get(`${cell[0]}-${cell[1]}`);
        if (!dot) continue;
        // Distance behind the head, wrapped around the ring.
        const distance = (head - i + ring.length) % ring.length;
        const trailIntensity = Math.exp(-distance / tail);
        // Fade the next dot in before the head crosses it. This removes the
        // full-opacity step at cell boundaries while preserving the trail.
        const forwardDistance = (i - head + ring.length) % ring.length;
        const leadProgress = forwardDistance < 1 ? 1 - forwardDistance : 0;
        const leadIntensity = leadProgress * leadProgress * (3 - 2 * leadProgress);
        const intensity = Math.max(trailIntensity, leadIntensity);
        dot.style.setProperty(
          "--_openui-dot-matrix-loader-dot-opacity",
          String(MIN_OPACITY + (1 - MIN_OPACITY) * intensity),
        );
      }
    };

    let frame: number;
    const tick = (now: number) => {
      const progress = (now % REVOLUTION_MS) / REVOLUTION_MS;
      paintRing(rings.outer, progress * rings.outer.length);
      paintRing(rings.inner, (1 - progress) * rings.inner.length);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [rings]);

  const dots = [];
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const key = `${row}-${col}`;
      dots.push(
        <span
          key={key}
          className={clsx(styles.dot, names.dot)}
          ref={(el) => {
            if (el) dotsRef.current.set(key, el);
            else dotsRef.current.delete(key);
          }}
        />,
      );
    }
  }

  return (
    <div
      className={clsx(styles.root, names.root, names.variant[variant], className)}
      role="status"
      aria-live="polite"
      aria-label="Loading"
      style={
        {
          "--_openui-dot-matrix-loader-grid-size": gridSize,
          "--_openui-dot-matrix-loader-size": `${resolvedSize}px`,
        } as CSSProperties
      }
    >
      {dots}
    </div>
  );
};

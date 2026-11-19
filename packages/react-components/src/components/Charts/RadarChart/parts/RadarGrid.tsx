"use client";

import clsx from "clsx";
import { radarAxisAngle } from "../../utils/polarUtils";
import { names, radarChartStyles } from "../radarChart.styles";

interface RadarGridProps {
  maxRadius: number;
  gridLevels: number;
  gridShape: "circle" | "polygon";
  numAxes: number;
}

function buildPolygonPoints(radius: number, numAxes: number): string {
  return Array.from({ length: numAxes }, (_, i) => {
    const angle = radarAxisAngle(i, numAxes);
    return `${radius * Math.cos(angle)},${radius * Math.sin(angle)}`;
  }).join(" ");
}

export function RadarGrid({ maxRadius, gridLevels, gridShape, numAxes }: RadarGridProps) {
  const styles = radarChartStyles;
  const levels = Array.from({ length: gridLevels }, (_, i) => ((i + 1) / gridLevels) * maxRadius);

  return (
    <g className={names.grid}>
      {levels.map((r) =>
        gridShape === "circle" ? (
          <circle
            key={r}
            cx={0}
            cy={0}
            r={r}
            className={clsx(styles.gridRing, names.gridRing)}
            fill="none"
          />
        ) : (
          <polygon
            key={r}
            points={buildPolygonPoints(r, numAxes)}
            className={clsx(styles.gridRing, names.gridRing)}
            fill="none"
          />
        ),
      )}
      {Array.from({ length: numAxes }, (_, i) => {
        const angle = radarAxisAngle(i, numAxes);
        return (
          <line
            key={i}
            x1={0}
            y1={0}
            x2={maxRadius * Math.cos(angle)}
            y2={maxRadius * Math.sin(angle)}
            className={clsx(styles.gridSpoke, names.gridSpoke)}
          />
        );
      })}
    </g>
  );
}

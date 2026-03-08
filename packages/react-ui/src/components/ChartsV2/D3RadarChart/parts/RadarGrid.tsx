import { radarAxisAngle } from "../../utils/polarUtils";

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
  const levels = Array.from({ length: gridLevels }, (_, i) => ((i + 1) / gridLevels) * maxRadius);

  return (
    <g className="openui-d3-radar-chart-grid">
      {levels.map((r) =>
        gridShape === "circle" ? (
          <circle
            key={r}
            cx={0}
            cy={0}
            r={r}
            className="openui-d3-radar-chart-grid-ring"
            fill="none"
          />
        ) : (
          <polygon
            key={r}
            points={buildPolygonPoints(r, numAxes)}
            className="openui-d3-radar-chart-grid-ring"
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
            className="openui-d3-radar-chart-grid-spoke"
          />
        );
      })}
    </g>
  );
}

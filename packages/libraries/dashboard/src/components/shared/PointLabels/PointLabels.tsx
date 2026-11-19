"use client";

import { type PlacedLabel } from "../../../shared/labels";

export type PointLabelsProps = {
  labels: PlacedLabel[];
  fontSize?: number;
  opacityOf?: (key: string | number) => number;
};

/** Draws placed labels on a surface halo, with a hairline leader for any that moved off their dot. */
export function PointLabels({ labels, fontSize = 11, opacityOf }: PointLabelsProps) {
  return (
    <g pointerEvents="none">
      {labels.map((label) => {
        const opacity = opacityOf?.(label.key) ?? 1;
        const up = label.ly < label.y;
        return (
          <g key={label.key} opacity={opacity}>
            {label.moved ? (
              <line
                x1={label.x}
                y1={up ? label.y - label.r : label.y + label.r}
                x2={label.lx}
                y2={up ? label.ly + 2 : label.ly - fontSize}
                stroke="var(--openui-dashboard-ink-muted)"
                strokeOpacity={0.5}
                strokeWidth={1}
              />
            ) : null}
            <text
              x={label.lx}
              y={label.ly}
              textAnchor="middle"
              fontSize={fontSize}
              fill="var(--openui-dashboard-ink-secondary)"
              stroke="var(--openui-dashboard-surface)"
              strokeWidth={3}
              strokeLinejoin="round"
              paintOrder="stroke"
            >
              {label.text}
            </text>
          </g>
        );
      })}
    </g>
  );
}

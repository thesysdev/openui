import React, { useCallback } from "react";

import type { CalendarLeveledCell } from "../../hooks/cartesian/useCalendarHeatmapOrchestrator";
import { entranceProps } from "../../utils/entranceUtils";
import { cellStaggerDelayMs } from "./staggerSeed";

const CELL_RADIUS = 2;

interface CalendarCellsProps {
  cells: CalendarLeveledCell[];
  classPrefix: string;
  pitchX: number;
  pitchY: number;
  cellW: number;
  cellH: number;
  gap: number;
  /** Per-level fill string (`var(--…)` or `url(#pattern)`), indexed by level. */
  levelFills: string[];
  /** Per-column x-offset in px (separator gutters); length `weeks`. */
  xOffsets: number[];
  rowOpacity?: number | number[];
  animate: boolean;
  animationDuration: number;
  onCellMouseMove: (event: React.MouseEvent, cell: CalendarLeveledCell) => void;
  onCellMouseLeave: () => void;
  onClick?: (date: Date, value: number) => void;
}

/** Per-row opacity multiplier: a flat number, an indexed array, or 1. */
function resolveRowOpacity(row: number, rowOpacity: number | number[] | undefined): number {
  if (rowOpacity === undefined) return 1;
  if (Array.isArray(rowOpacity)) return rowOpacity[row] ?? 1;
  return rowOpacity;
}

/**
 * The cell grid: one `<rect>` per non-ghost calendar day. Fill comes from the
 * per-level `levelFills` entry — a level CSS var
 * (`--<prefix>-calendar-heatmap-level-N`) or a `url(#pattern)` when that level
 * sets one — so a level can be restyled without re-rendering; the entrance is an
 * opacity fade with a deterministic per-cell delay. Each cell x also picks up
 * its column's separator-gutter offset. Hover highlight is pure CSS (`:hover`
 * stroke) — these handlers only feed the tooltip/click state. `rowOpacity` dims
 * via fill-opacity, NOT opacity, so it never fights the entrance keyframe's
 * forwards `opacity`.
 */
export function CalendarCells({
  cells,
  classPrefix,
  pitchX,
  pitchY,
  cellW,
  cellH,
  gap,
  levelFills,
  xOffsets,
  rowOpacity,
  animate,
  animationDuration,
  onCellMouseMove,
  onCellMouseLeave,
  onClick,
}: CalendarCellsProps) {
  const handleClick = useCallback(
    (cell: CalendarLeveledCell) => {
      onClick?.(cell.date, cell.value);
    },
    [onClick],
  );

  return (
    <g>
      {cells.map((cell) => {
        const { className: animatedClass, animationDelay } = entranceProps(
          animate,
          `${classPrefix}-cell--animated`,
          cellStaggerDelayMs(cell.col, cell.row, animationDuration),
        );
        const modifiers = [
          animatedClass,
          // Static per-level marker so the container can dim non-matching cells
          // via CSS on level-hover (no per-cell JS style churn).
          `${classPrefix}-cell--level-${cell.level}`,
          cell.ghost ? `${classPrefix}-cell--ghost` : "",
        ]
          .filter(Boolean)
          .join(" ");
        const opacity = resolveRowOpacity(cell.row, rowOpacity);

        return (
          <rect
            key={`${cell.col}-${cell.row}`}
            className={`${classPrefix}-cell${modifiers ? ` ${modifiers}` : ""}`}
            x={cell.col * pitchX + gap / 2 + (xOffsets[cell.col] ?? 0)}
            y={cell.row * pitchY + gap / 2}
            width={cellW}
            height={cellH}
            rx={CELL_RADIUS}
            fillOpacity={opacity !== 1 ? opacity : undefined}
            style={{
              fill: levelFills[cell.level],
              animationDelay,
              cursor: onClick ? "pointer" : undefined,
            }}
            onMouseMove={(event) => onCellMouseMove(event, cell)}
            onMouseLeave={onCellMouseLeave}
            onClick={() => handleClick(cell)}
          />
        );
      })}
    </g>
  );
}

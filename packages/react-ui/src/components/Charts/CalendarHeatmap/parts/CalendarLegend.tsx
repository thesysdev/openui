import { forwardRef } from "react";
import type { CalendarLevelStyle } from "../types";
import { calendarPatternId } from "./CalendarPatternDefs";

/** Opacity of inactive swatches while a level is highlighted (bklit parity). */
const INACTIVE_OPACITY = 0.3;
const SWATCH_SIZE = 12;
const SWATCH_RADIUS = 2;

interface CalendarLegendProps {
  /** Discrete squares or a continuous color bar. */
  variant: "swatches" | "gradient";
  /** Resolved level colors (length 5), low → high. */
  levelColors: string[];
  /** Resolved per-level styles (length 5) — drives swatch patterns. */
  levelStyles: ReadonlyArray<CalendarLevelStyle | null>;
  /** `useId` base shared with the chart's pattern `<defs>`. */
  patternBaseId: string;
  /** Bracketing labels. */
  labels: { less: string; more: string };
  /** The level currently highlighted (legend hover ∪ cell hover), or null. */
  highlightedLevel: number | null;
  /** Hover a level → drives the grid dim + swatch highlight. */
  onLevelEnter: (level: number) => void;
  onLevelLeave: () => void;
  classPrefix: string;
}

const LEVELS = [0, 1, 2, 3, 4] as const;

/** One legend square — a colored tile, or a patterned tile via the shared defs. */
function LegendSwatch({
  level,
  color,
  pattern,
  patternBaseId,
  classPrefix,
}: {
  level: number;
  color: string;
  pattern: boolean;
  patternBaseId: string;
  classPrefix: string;
}) {
  if (pattern) {
    return (
      <svg
        className={`${classPrefix}-legend-swatch`}
        width={SWATCH_SIZE}
        height={SWATCH_SIZE}
        aria-hidden="true"
      >
        <rect
          width={SWATCH_SIZE}
          height={SWATCH_SIZE}
          rx={SWATCH_RADIUS}
          fill={`url(#${calendarPatternId(patternBaseId, level)})`}
        />
      </svg>
    );
  }
  return (
    <span
      className={`${classPrefix}-legend-swatch`}
      style={{ backgroundColor: color }}
      aria-hidden="true"
    />
  );
}

/**
 * The Less→More scale legend. `swatches` renders five discrete tiles (patterned
 * when a level sets one); `gradient` renders a continuous color bar with
 * invisible per-level hit segments. Both bracket with the Less/More labels and
 * are bidirectionally linked to the grid: hovering a level dims the non-matching
 * cells and highlights that swatch, and (via `highlightedLevel`) a hovered cell
 * highlights its swatch here. Forwards its ref so the shell can reserve height.
 */
export const CalendarLegend = forwardRef<HTMLDivElement, CalendarLegendProps>(
  function CalendarLegend(
    {
      variant,
      levelColors,
      levelStyles,
      patternBaseId,
      labels,
      highlightedLevel,
      onLevelEnter,
      onLevelLeave,
      classPrefix,
    },
    ref,
  ) {
    const isDimming = highlightedLevel !== null;
    const swatchOpacity = (level: number) =>
      isDimming && highlightedLevel !== level ? INACTIVE_OPACITY : 1;

    const gradientStops = levelColors
      .map((color, index) => `${color} ${(index / (LEVELS.length - 1)) * 100}%`)
      .join(", ");

    return (
      <div ref={ref} className={`${classPrefix}-legend`}>
        <span className={`${classPrefix}-legend-label`}>{labels.less}</span>

        {variant === "gradient" ? (
          <div
            className={`${classPrefix}-legend-gradient`}
            style={{
              background: `linear-gradient(to right, ${gradientStops})`,
            }}
          >
            {LEVELS.map((level) => (
              <span
                key={level}
                className={`${classPrefix}-legend-gradient-hit`}
                style={{
                  left: `${(level / LEVELS.length) * 100}%`,
                  width: `${(1 / LEVELS.length) * 100}%`,
                }}
                onPointerEnter={() => onLevelEnter(level)}
                onPointerLeave={onLevelLeave}
              />
            ))}
          </div>
        ) : (
          <div className={`${classPrefix}-legend-swatches`}>
            {LEVELS.map((level) => (
              <span
                key={level}
                className={`${classPrefix}-legend-swatch-slot`}
                style={{ opacity: swatchOpacity(level) }}
                onPointerEnter={() => onLevelEnter(level)}
                onPointerLeave={onLevelLeave}
              >
                <LegendSwatch
                  level={level}
                  color={levelColors[level] ?? "#000000"}
                  pattern={Boolean(levelStyles[level]?.pattern)}
                  patternBaseId={patternBaseId}
                  classPrefix={classPrefix}
                />
              </span>
            ))}
          </div>
        )}

        <span className={`${classPrefix}-legend-label`}>{labels.more}</span>
      </div>
    );
  },
);

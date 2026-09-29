import type { CalendarLevelPattern } from "../types";

/** Default pattern stroke — a theme-adaptive contrast token over the tile. */
const DEFAULT_PATTERN_STROKE = "var(--openui-foreground)";

/** The SVG `<pattern>` id for a level, namespaced by the chart's `useId` base. */
export function calendarPatternId(baseId: string, level: number): string {
  return `${baseId}-pattern-level-${level}`;
}

interface PatternTile {
  width: number;
  height: number;
  strokeWidth: number;
  /** Line paths (hatch presets) drawn in the stroke color. */
  paths?: string[];
  /** Dot radius (dot preset) — a filled circle in the stroke color. */
  dotRadius?: number;
}

// visx `PatternLines` path builders (orientation → tile path), reproduced as
// pure SVG so the port carries no @visx dependency.
function diagonalPath(w: number, h: number): string {
  return `M 0,${h} l ${w},${-h} M ${-w / 4},${h / 4} l ${w / 2},${-h / 2} M ${(3 / 4) * w},${(5 / 4) * h} l ${w / 2},${-h / 2}`;
}

function diagonalRtlPath(w: number, h: number): string {
  return `M 0,0 l ${w},${h} M ${-w / 4},${(3 / 4) * h} l ${w / 2},${h / 2} M ${(3 / 4) * w},${-h / 4} l ${w / 2},${h / 2}`;
}

/** Tile geometry per preset, mirroring bklit `patternPresetTileSize` (cross ×1.33). */
function patternTile(pattern: CalendarLevelPattern): PatternTile {
  switch (pattern) {
    case "diagonal":
      return {
        width: 6,
        height: 6,
        strokeWidth: 1,
        paths: [diagonalPath(6, 6)],
      };
    case "horizontal":
      return { width: 6, height: 6, strokeWidth: 1, paths: [`M 0,3 l 6,0`] };
    case "vertical":
      return { width: 6, height: 6, strokeWidth: 1, paths: [`M 3,0 l 0,6`] };
    case "cross": {
      const w = 8 * 1.33;
      const h = 8 * 1.33;
      return {
        width: w,
        height: h,
        strokeWidth: 1.33,
        paths: [diagonalPath(w, h), diagonalRtlPath(w, h)],
      };
    }
    case "dots":
      return { width: 10, height: 10, strokeWidth: 0, dotRadius: 1.5 };
  }
}

/** A single `<pattern>`: the level color as a background tile + the overlay. */
function CalendarPattern({
  id,
  pattern,
  tileBackground,
  stroke,
}: {
  id: string;
  pattern: CalendarLevelPattern;
  tileBackground: string;
  stroke: string;
}) {
  const tile = patternTile(pattern);
  return (
    <pattern id={id} width={tile.width} height={tile.height} patternUnits="userSpaceOnUse">
      <rect width={tile.width} height={tile.height} fill={tileBackground} />
      {tile.dotRadius != null ? (
        <circle cx={tile.width / 2} cy={tile.height / 2} r={tile.dotRadius} fill={stroke} />
      ) : (
        tile.paths?.map((d, index) => (
          <path
            key={index}
            d={d}
            stroke={stroke}
            strokeWidth={tile.strokeWidth}
            strokeLinecap="square"
            fill="transparent"
            shapeRendering="auto"
          />
        ))
      )}
    </pattern>
  );
}

interface CalendarPatternDefsProps {
  /** `useId` base so ids stay unique across multiple charts on a page. */
  baseId: string;
  /** Resolved per-level styles (length 5); only entries with a pattern emit. */
  levelStyles: ReadonlyArray<{
    pattern?: CalendarLevelPattern;
    patternColor?: string;
  } | null>;
  /** Resolved level colors (length 5) — each pattern tiles over its level color. */
  levelColors: string[];
}

/**
 * The `<defs>` of tile patterns for any level whose `levelStyle` sets a
 * `pattern`. Each pattern paints the level's color as the tile background and
 * overlays the hatch/dots in `patternColor` (defaulting to the theme foreground)
 * — bklit's overlay-on-color look. Cells and legend swatches reference these by
 * `url(#…)` via {@link calendarPatternId}. Renders nothing when no level
 * carries a pattern.
 */
export function CalendarPatternDefs({
  baseId,
  levelStyles,
  levelColors,
}: CalendarPatternDefsProps) {
  const patterns = levelStyles.flatMap((style, level) => {
    const pattern = style?.pattern;
    if (!pattern) return [];
    return [
      <CalendarPattern
        key={level}
        id={calendarPatternId(baseId, level)}
        pattern={pattern}
        tileBackground={levelColors[level] ?? "#000000"}
        stroke={style?.patternColor?.trim() || DEFAULT_PATTERN_STROKE}
      />,
    ];
  });

  if (patterns.length === 0) return null;
  return <defs>{patterns}</defs>;
}

/**
 * Pure text layout helpers for native SVG `<text>` axis labels.
 *
 * SVG `<text>` has no equivalent of CSS `-webkit-line-clamp` or
 * `text-overflow: ellipsis`, so we hand-roll wrapping + measured-trim ellipsis
 * over a canvas 2D context (the same context used to size the axis band). Both
 * the renderer (`XAxis`) and the height hook (`useXAxisHeight`) call these, so
 * the rendered line count and the reserved band height stay in agreement — no
 * SCSS↔TS magic-number contract.
 *
 * Note: canvas `measureText` ignores theme letter-spacing — a pre-existing
 * limitation shared with the y-axis width measurement.
 */

/** Max wrapped lines for a multi-line tick label (was `-webkit-line-clamp: 3`). */
export const MAX_LABEL_LINES = 3;

const ELLIPSIS = "…";

const measure = (ctx: CanvasRenderingContext2D, s: string): number => ctx.measureText(s).width;

/**
 * Parse line-height (px) from a CSS font shorthand.
 * Handles px line-heights ("400 12px/15px Inter") and unitless multipliers
 * ("400 12px/1.25 Inter"); falls back to the browser default (1.2×).
 */
export function parseLineHeight(fontShorthand: string): number {
  const sizeMatch = fontShorthand.match(/(\d+(?:\.\d+)?)px/);
  const fontSize = sizeMatch ? parseFloat(sizeMatch[1]!) : 12;

  const lhMatch = fontShorthand.match(/\/(\d+(?:\.\d+)?)(px)?/);
  if (!lhMatch) return Math.ceil(fontSize * 1.2);

  const lhValue = parseFloat(lhMatch[1]!);
  const hasPxUnit = !!lhMatch[2];
  return hasPxUnit ? lhValue : Math.ceil(fontSize * lhValue);
}

/** Trim `line` and append an ellipsis so it fits within `maxWidth`. */
function withEllipsis(ctx: CanvasRenderingContext2D, line: string, maxWidth: number): string {
  // Trim by code points (Array.from iterates code points, not UTF-16 units)
  // so an astral character at the cut never leaves a lone surrogate behind.
  let chars = Array.from(line);
  while (chars.length > 0 && measure(ctx, chars.join("") + ELLIPSIS) > maxWidth) {
    chars = chars.slice(0, -1);
  }
  return chars.join("").trimEnd() + ELLIPSIS;
}

/** Single-line: return `text` unchanged if it fits, else a measured-trim ellipsis. */
export function truncateToWidth(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string {
  if (maxWidth <= 0 || !text) return text;
  if (measure(ctx, text) <= maxWidth) return text;
  return withEllipsis(ctx, text, maxWidth);
}

/**
 * Wrap `text` into lines that each fit `maxWidth` (CSS `break-word` behaviour:
 * over-long words break mid-word), capped at `maxLines`. If the text overflows
 * the cap, the last kept line is ellipsized. Returns the lines to render as
 * `<tspan>`s — and `.length` is the line count `useXAxisHeight` reserves space for.
 */
export function wrapLabelLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number = MAX_LABEL_LINES,
): string[] {
  if (!text) return [""];
  if (maxWidth <= 0) return [text];

  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  const commit = () => {
    if (line) {
      lines.push(line);
      line = "";
    }
  };

  for (const word of words) {
    if (measure(ctx, word) > maxWidth) {
      // Word exceeds the line — break it character by character.
      for (const ch of word) {
        if (line && measure(ctx, line + ch) > maxWidth) commit();
        line += ch;
      }
    } else {
      const candidate = line ? `${line} ${word}` : word;
      if (line && measure(ctx, candidate) > maxWidth) {
        commit();
        line = word;
      } else {
        line = candidate;
      }
    }
  }
  commit();

  if (lines.length === 0) return [text];
  if (lines.length <= maxLines) return lines;

  const kept = lines.slice(0, maxLines);
  kept[maxLines - 1] = withEllipsis(ctx, kept[maxLines - 1]!, maxWidth);
  return kept;
}

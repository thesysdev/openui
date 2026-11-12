// Text-on-color contrast support for in-cell labels: resolve any CSS color
// string to a WCAG relative luminance, then pick dark or light text against
// it. Client-only at the normalization layer (callers gate on hydration; the
// pure math is exported separately for tests).

/** WCAG 2.x relative luminance from 8-bit sRGB channels. Pure. */
export const relativeLuminanceFromRgb = (r: number, g: number, b: number): number => {
  const linear = (v: number) => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
};

/**
 * The equal-contrast pivot: above this background luminance, black text has
 * the higher WCAG contrast ratio; below it, white text does. (Solve
 * (L+0.05)/(0+0.05) = (1+0.05)/(L+0.05) for L.)
 */
export const LUMINANCE_TEXT_PIVOT = 0.179;

let normalizerContext: CanvasRenderingContext2D | null | undefined;
const luminanceCache = new Map<string, number | null>();
// Ramps are ~11 colors, so the cache stays tiny in practice — the cap only
// guards a pathological consumer cycling unique customPalettes for hours.
const LUMINANCE_CACHE_LIMIT = 512;

/**
 * Relative luminance of any CSS color string, or null when it can't be
 * resolved (SSR, canvas unavailable). Uses canvas fillStyle normalization:
 * assigning any valid CSS color reads back as '#rrggbb' (or 'rgba(…)' with
 * alpha) per the canvas spec — named colors, hsl(), rgb(), hex shorthand all
 * covered with zero parsing code. Invalid colors leave the priming black in
 * place and resolve to luminance 0 (light text), a deterministic fallback.
 */
export const getColorLuminance = (color: string): number | null => {
  const cached = luminanceCache.get(color);
  if (cached !== undefined) return cached;

  if (normalizerContext === undefined) {
    normalizerContext =
      typeof document === "undefined" ? null : document.createElement("canvas").getContext("2d");
  }
  if (!normalizerContext) return null;

  normalizerContext.fillStyle = "#000000";
  normalizerContext.fillStyle = color;
  const normalized = String(normalizerContext.fillStyle);

  let luminance: number | null = null;
  if (normalized.startsWith("#") && normalized.length === 7) {
    luminance = relativeLuminanceFromRgb(
      parseInt(normalized.slice(1, 3), 16),
      parseInt(normalized.slice(3, 5), 16),
      parseInt(normalized.slice(5, 7), 16),
    );
  } else {
    const match = normalized.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      luminance = relativeLuminanceFromRgb(Number(match[1]), Number(match[2]), Number(match[3]));
    }
  }

  if (luminanceCache.size >= LUMINANCE_CACHE_LIMIT) luminanceCache.clear();
  luminanceCache.set(color, luminance);
  return luminance;
};

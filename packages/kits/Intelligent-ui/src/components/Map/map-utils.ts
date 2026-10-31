import clsx from "clsx";
import type { LngLatBoundsLike } from "maplibre-gl";
import { names, styles } from "./map.styles";

/** [lat, lng]. MapLibre itself takes [lng, lat]; convert with `lngLat`. */
export type LatLng = [number, number];

export const coordinate = (input: unknown): LatLng | null => {
  if (!input || typeof input !== "object") return null;
  const { lat, lng } = input as { lat?: unknown; lng?: unknown };
  return typeof lat === "number" && typeof lng === "number" && Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180
    ? [lat, lng] : null;
};

export const lngLat = ([lat, lng]: LatLng): [number, number] => [lng, lat];

export const boundsOf = (points: LatLng[]): LngLatBoundsLike => {
  const lats = points.map((p) => p[0]); const lngs = points.map((p) => p[1]);
  return [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]];
};

export const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** The first points of a line, cut at `progress` (0–1) of its length. */
export function partialLine(points: LatLng[], progress: number): LatLng[] {
  const lengths = points.slice(1).map((p, i) => Math.hypot(p[0] - points[i][0], p[1] - points[i][1]));
  let remaining = lengths.reduce((a, b) => a + b, 0) * progress;
  const out: LatLng[] = [points[0]];
  for (let i = 0; i < lengths.length; i++) {
    if (remaining >= lengths[i]) { out.push(points[i + 1]); remaining -= lengths[i]; continue; }
    const t = lengths[i] ? remaining / lengths[i] : 0;
    out.push([points[i][0] + (points[i + 1][0] - points[i][0]) * t, points[i][1] + (points[i + 1][1] - points[i][1]) * t]);
    break;
  }
  return out;
}

// Pins are round and sized for one emoji. Use the first character only if it
// is an emoji, so a word or letter from the model can't overflow the pin.
const graphemes = new Intl.Segmenter(undefined, { granularity: "grapheme" });
export function pinEmoji(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const first = graphemes.segment(value.trim())[Symbol.iterator]().next().value?.segment;
  return first && /\p{Extended_Pictographic}/u.test(first) ? first : null;
}

/** A focusable pin with a label underneath; Enter/Space and click both select it. */
/**
 * A CSS colour as MapLibre can parse it. A theme's tokens may be oklch, which it rejects with an
 * error that would drop the map to its fallback tiles, so a canvas resolves the colour to rgba.
 */
export function mapColor(value: string, fallback = "#272727"): string {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const context = canvas.getContext("2d");
  if (!context) return fallback;
  context.fillStyle = fallback;
  context.fillStyle = value || fallback;
  context.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
  return `rgba(${r}, ${g}, ${b}, ${a / 255})`;
}

export function createPinElement(onSelect: () => void) {
  const element = document.createElement("div");
  element.className = clsx(styles.marker, names.marker);
  element.tabIndex = 0;
  element.setAttribute("role", "button");
  const content = document.createElement("div");
  content.className = clsx(styles.markerContent, names.markerContent);
  const pin = document.createElement("span");
  pin.className = clsx(styles.pin, names.pin);
  const label = document.createElement("span");
  label.className = clsx(styles.label, names.label);
  content.append(pin, label);
  element.append(content);
  element.addEventListener("click", onSelect);
  element.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect(); } });
  return { element, pin, label };
}

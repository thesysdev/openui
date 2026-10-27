import type { LngLatBoundsLike } from "maplibre-gl";

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
export function createPinElement(onSelect: () => void) {
  const element = document.createElement("div");
  element.className = "iui-map-marker";
  element.tabIndex = 0;
  element.setAttribute("role", "button");
  const content = document.createElement("div");
  content.className = "iui-map-marker-content";
  const pin = document.createElement("span");
  pin.className = "iui-map-pin";
  const label = document.createElement("span");
  label.className = "iui-map-label";
  content.append(pin, label);
  element.append(content);
  element.addEventListener("click", onSelect);
  element.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect(); } });
  return { element, pin, label };
}

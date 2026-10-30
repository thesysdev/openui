import { coordinate, pinEmoji } from "../components/Map/map-utils";
import type { Place } from "../components/Map/place";

/** Markers as plain data. While streaming, only finished markers count, so a half-written -12 never moves a pin. */
export function placesOf(markers: unknown, streaming: boolean): Place[] {
  const seen = new Map<string, number>();
  const out: Place[] = [];
  (Array.isArray(markers) ? markers.flat() : []).forEach((item, order) => {
    const el = item as { type?: string; partial?: boolean; props?: Record<string, unknown> } | null;
    if (el?.type !== "element" || !el.props || (streaming && el.partial)) return;
    const { label, lat, lng, category, icon } = el.props;
    if (typeof label !== "string" || !label.trim() || !coordinate({ lat, lng })) return;
    const count = seen.get(label) ?? 0;
    seen.set(label, count + 1);
    out.push({
      key: count ? `${label} (${count + 1})` : label,
      label,
      lat: lat as number,
      lng: lng as number,
      category: typeof category === "string" && category.trim() ? category.trim() : undefined,
      icon: pinEmoji(icon),
      order,
    });
  });
  return out;
}

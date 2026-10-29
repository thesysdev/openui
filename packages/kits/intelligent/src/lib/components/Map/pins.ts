import type { Map as MapLibreMap, Marker } from "maplibre-gl";
import type { MapLibre } from "./basemap";
import { createPinElement, lngLat } from "./map-utils";
import type { Place } from "./places";

export type PinEntry = { marker: Marker; element: HTMLDivElement; pin: HTMLSpanElement; label: HTMLSpanElement };

/** Reconciles pins with the visible places: stale pins go, new ones are added, the rest update in place. */
export function syncPins(
  lib: MapLibre,
  map: MapLibreMap,
  pins: Map<string, PinEntry>,
  visible: Place[],
  selected: string | null,
  onPick: (place: Place) => void,
) {
  const keys = new Set(visible.map((p) => p.key));
  for (const [key, entry] of pins) {
    if (!keys.has(key)) { entry.marker.remove(); pins.delete(key); }
  }
  visible.forEach((place) => {
    let entry = pins.get(place.key);
    if (!entry) {
      const pinElement = createPinElement(() => onPick(place));
      // Anchor the pin's centre (not the label below it) on the coordinate.
      const marker = new lib.Marker({ element: pinElement.element, anchor: "top", offset: [0, -17] }).setLngLat(lngLat([place.lat, place.lng])).addTo(map);
      entry = { marker, ...pinElement };
      pins.set(place.key, entry);
    }
    entry.marker.setLngLat(lngLat([place.lat, place.lng]));
    entry.element.style.zIndex = selected === place.label ? "2" : "";
    entry.element.title = place.label;
    entry.element.setAttribute("aria-label", place.label);
    entry.element.setAttribute("aria-pressed", String(selected === place.label));
    entry.pin.classList.toggle("is-selected", selected === place.label);
    entry.pin.classList.toggle("is-numbered", !place.icon);
    entry.pin.textContent = place.icon ?? String(place.order + 1);
    entry.label.textContent = place.label;
  });
}

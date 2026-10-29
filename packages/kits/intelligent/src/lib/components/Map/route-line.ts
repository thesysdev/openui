import type { GeoJSONSource, Map as MapLibreMap } from "maplibre-gl";
import { type LatLng, lngLat, partialLine } from "./map-utils";

export const ROUTE = "route";

export function setLine(map: MapLibreMap, points: LatLng[]) {
  (map.getSource(ROUTE) as GeoJSONSource | undefined)?.setData({
    type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: points.map(lngLat) },
  });
}

/** Adds the route source and layer when the current style lacks them (each style load starts without them). */
export function ensureRouteLayer(map: MapLibreMap, ink: string) {
  if (!map.getSource(ROUTE)) map.addSource(ROUTE, { type: "geojson", data: { type: "FeatureCollection", features: [] } });
  if (!map.getLayer(ROUTE)) map.addLayer({ id: ROUTE, type: "line", source: ROUTE, layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": ink, "line-width": 3.2 } });
}

/** Draws the line from its first point over durationMs, easing in and out. Returns a function that stops it. */
export function animateLine(map: MapLibreMap, positions: LatLng[], durationMs: number, onDone: () => void): () => void {
  const start = performance.now();
  let frame = requestAnimationFrame(function draw(now) {
    const t = Math.min(1, (now - start) / durationMs);
    setLine(map, partialLine(positions, t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2));
    if (t < 1) frame = requestAnimationFrame(draw);
    else onDone();
  });
  return () => cancelAnimationFrame(frame);
}

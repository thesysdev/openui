import { useEffect, useState } from "react";
import { endpoints } from "../../config";
import { coordinate, type LatLng } from "./map-utils";

const cache = new Map<string, LatLng[]>();

/**
 * Street geometry for a "lng,lat;lng,lat" key from /api/street-route, fetched in
 * the background so the answer never waits for a map service.
 * Returns points, `null` when routing failed, or `undefined` while loading.
 */
export function useStreetRoute(routingKey: string, enabled: boolean): LatLng[] | null | undefined {
  const [result, setResult] = useState<{ key: string; points: LatLng[] | null } | null>(null);
  useEffect(() => {
    if (!enabled || !routingKey.includes(";") || cache.has(routingKey)) return;
    const controller = new AbortController();
    let active = true;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const debounce = setTimeout(async () => {
      timeout = setTimeout(() => controller.abort(), 10000);
      try {
        const response = await fetch(endpoints.streetRoute(routingKey), { signal: controller.signal });
        if (!response.ok) throw new Error("Route service unavailable");
        const data: { points?: unknown[] } = await response.json();
        const points = (data.points ?? []).flatMap((point) => {
          const result = Array.isArray(point) ? coordinate({ lat: point[0], lng: point[1] }) : null;
          return result ? [result] : [];
        });
        if (points.length < 2) throw new Error("No street route available");
        if (cache.size >= 64) cache.delete(cache.keys().next().value!);
        cache.set(routingKey, points);
        if (active) setResult({ key: routingKey, points });
      } catch {
        if (active) setResult({ key: routingKey, points: null });
      } finally { clearTimeout(timeout); }
    }, 700);
    return () => { active = false; clearTimeout(debounce); clearTimeout(timeout); controller.abort(); };
  }, [routingKey, enabled]);
  return cache.get(routingKey) ?? (result?.key === routingKey ? result.points : undefined);
}

"use client";

import "maplibre-gl/dist/maplibre-gl.css";

import { defineComponent, reactive, useIsStreaming, useStateField } from "@openuidev/react-lang";
import { useEffect, useId, useRef, useState } from "react";
import type { GeoJSONSource, Map as MapLibreMap, Marker } from "maplibre-gl";
import { z } from "zod/v4";
import { useColorScheme } from "../scheme";
import { loadMapLibre, rasterStyle, vectorStyle, type MapLibre } from "./basemap";
import { boundsOf, coordinate, createPinElement, lngLat, partialLine, pinEmoji, reducedMotion, type LatLng } from "./map-utils";
import { useDialog } from "./use-dialog";
import { useStreetRoute } from "./use-street-route";

const ROUTE = "route";
// Room for the controls on top and for labels, which hang below and beside each pin.
const FRAME_PADDING = { top: 70, left: 72, bottom: 50, right: 72 };
const FLY_MS = 920;
const DRAW_MS = 760;

type Place = { key: string; label: string; lat: number; lng: number; category?: string; icon: string | null; order: number };

function setLine(map: MapLibreMap, points: LatLng[]) {
  (map.getSource(ROUTE) as GeoJSONSource | undefined)?.setData({
    type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: points.map(lngLat) },
  });
}

/** Markers as plain data. While streaming, only finished markers count, so a half-written -12 never moves a pin. */
function placesOf(markers: unknown, streaming: boolean): Place[] {
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

export const MapMarker = defineComponent({
  name: "MapMarker",
  props: z.object({
    label: z.string(),
    lat: z.number(),
    lng: z.number(),
    category: z.string().optional(),
    icon: z.string().optional(),
  }),
  description: "A place on a Map; icon is one emoji, else the pin shows its number.",
  component: () => null,
});

export const MapView = defineComponent({
  name: "Map",
  props: z.object({
    markers: z.array(MapMarker.ref),
    route: z.boolean().optional(),
    selected: reactive(z.string().optional()),
    height: z.number().optional(),
  }),
  description: "Street map fitted to its markers. route draws the road path in marker order; selected holds the clicked marker's label.",
  component: function MapComponent({ props, statementId }) {
    const streaming = useIsStreaming();
    const fallbackId = useId();
    const selection = useStateField(statementId ?? `map-${fallbackId}`, props.selected);
    const selected = typeof selection.value === "string" ? selection.value : null;
    const container = useRef<HTMLDivElement>(null);
    const surface = useRef<HTMLDivElement>(null);
    const map = useRef<MapLibreMap | null>(null);
    const markers = useRef(new Map<string, { marker: Marker; element: HTMLDivElement; pin: HTMLSpanElement; label: HTMLSpanElement }>());
    const fitPoints = useRef<LatLng[]>([]);
    const fitSignature = useRef("");
    const linePoints = useRef<LatLng[]>([]);
    const lineDrawn = useRef(false);
    const anchored = useRef(false);
    const userMoved = useRef(false);
    const expandedNow = useRef(false);
    const select = useRef<(label: string) => void>(() => {});
    const [lib, setLib] = useState<MapLibre | null>(null);
    const [ready, setReady] = useState(false);
    const [framedKey, setFramedKey] = useState("");
    const [expanded, setExpanded] = useState(false);
    const [group, setGroup] = useState("all");
    const [infoOpen, setInfoOpen] = useState(false);
    const [mapError, setMapError] = useState(false);
    const dark = useColorScheme(container) === "dark";
    // Phones get a shorter map so it never fills the whole screen.
    const height = `min(${Math.min(720, Math.max(200, props.height ?? 400))}px, max(280px, 82vw))`;

    const places = placesOf(props.markers, streaming);
    const visible = places.filter((p) => group === "all" || p.category === group);
    const categories = Array.from(new Set(places.map((p) => p.category).filter((c): c is string => !!c)));
    const placeSignature = JSON.stringify(places.map((p) => [p.key, p.lat, p.lng, p.icon, p.category, p.order]));
    const routingKey = visible.map((p) => `${p.lng},${p.lat}`).join(";");
    const streetPoints = useStreetRoute(routingKey, !!props.route);
    const routeKind = !props.route ? "none" : streetPoints?.length ? "street" : streetPoints === null ? "overview" : "loading";
    select.current = (label) => selection.setValue(label);
    useDialog(container, expanded, () => setExpanded(false));

    useEffect(() => {
      let active = true;
      loadMapLibre().then((module) => { if (active) setLib(module); });
      return () => { active = false; };
    }, []);

    useEffect(() => {
      if (!lib || !surface.current) return;
      // Zoom levels are one lower than Leaflet's: MapLibre uses 512px tiles.
      const instance = new lib.Map({
        container: surface.current, style: vectorStyle(dark), center: [0, 20], zoom: 1, minZoom: 0,
        scrollZoom: false, dragRotate: false, pitchWithRotate: false, touchPitch: false, attributionControl: false,
        // On a phone a one-finger swipe scrolls the answer instead of getting stuck on the map.
        cooperativeGestures: window.matchMedia("(pointer: coarse)").matches,
      });
      instance.touchZoomRotate.disableRotation();
      instance.addControl(new lib.AttributionControl({ compact: false }), "bottom-left");
      instance.addControl(new lib.NavigationControl({ showCompass: false }), "bottom-right");
      let fellBack = false;
      // Re-adds the route line whenever a style (vector, dark or fallback) finishes loading.
      instance.on("style.load", () => {
        const ink = getComputedStyle(container.current ?? document.body).getPropertyValue("--iui-ink").trim() || "#272727";
        if (!instance.getSource(ROUTE)) instance.addSource(ROUTE, { type: "geojson", data: { type: "FeatureCollection", features: [] } });
        if (!instance.getLayer(ROUTE)) instance.addLayer({ id: ROUTE, type: "line", source: ROUTE, layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": ink, "line-width": 3.2 } });
        setLine(instance, linePoints.current);
        setReady(true);
      });
      // Fall back to raster tiles if the vector style or its tile source fails.
      instance.on("error", (event) => {
        if (fellBack) { setMapError(true); return; }
        const source = (event as { sourceId?: string }).sourceId;
        if (source && source !== "places") return;
        fellBack = true;
        instance.setStyle(rasterStyle(getComputedStyle(surface.current ?? document.body).colorScheme === "dark"));
      });
      instance.on("sourcedata", (event) => { if (fellBack && event.isSourceLoaded) setMapError(false); });
      instance.on("dragstart", () => { userMoved.current = true; });
      map.current = instance;
      const markerEntries = markers.current;
      // A resize must never reframe the camera during streaming or user panning.
      const observer = new ResizeObserver(() => instance.resize());
      observer.observe(surface.current);
      return () => {
        observer.disconnect(); markerEntries.forEach((entry) => entry.marker.remove()); markerEntries.clear();
        instance.remove(); map.current = null; fitSignature.current = ""; lineDrawn.current = false; anchored.current = false; setReady(false);
      };
      // The theme is applied by the effect below without rebuilding the map.
    }, [lib]);

    // Theme changes swap the basemap style in place; markers are DOM and stay.
    const styledDark = useRef(dark);
    useEffect(() => {
      if (!map.current || styledDark.current === dark) return;
      styledDark.current = dark;
      map.current.setStyle(vectorStyle(dark), { diff: false });
    }, [dark]);

    useEffect(() => { expandedNow.current = expanded; }, [expanded]);

    // Reconcile pins with the visible places; existing pins update in place.
    useEffect(() => {
      if (!lib || !ready || !map.current) return;
      const keys = new Set(visible.map((p) => p.key));
      for (const [key, entry] of markers.current) {
        if (!keys.has(key)) { entry.marker.remove(); markers.current.delete(key); }
      }
      visible.forEach((place) => {
        let entry = markers.current.get(place.key);
        if (!entry) {
          const pinElement = createPinElement(() => {
            select.current(place.label);
            if (expandedNow.current) setExpanded(false);
          });
          // Anchor the pin's centre (not the label below it) on the coordinate.
          const marker = new lib.Marker({ element: pinElement.element, anchor: "top", offset: [0, -17] }).setLngLat(lngLat([place.lat, place.lng])).addTo(map.current!);
          entry = { marker, ...pinElement };
          markers.current.set(place.key, entry);
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
      fitPoints.current = visible.map((p) => [p.lat, p.lng] as LatLng);
      if (fitPoints.current.length && !anchored.current) {
        // Begin with a steady city overview; later points do not move the camera.
        map.current.jumpTo({ center: lngLat(fitPoints.current[0]), zoom: 10.5 });
        anchored.current = true;
      }
      // Object identities change every token; reconcile completed primitive values only.
    }, [lib, ready, placeSignature, group, selected]);

    // Once streaming ends (or the filter changes), fly to fit the markers.
    useEffect(() => {
      if (!ready || !map.current || streaming || !fitPoints.current.length) return;
      const nextFit = JSON.stringify([group, routingKey]);
      if (fitSignature.current === nextFit) return;
      fitSignature.current = nextFit;
      // A filter change must not keep displaying the previous group's route.
      linePoints.current = []; setLine(map.current, []);
      if (userMoved.current || reducedMotion()) {
        if (!userMoved.current) map.current.fitBounds(boundsOf(fitPoints.current), { padding: FRAME_PADDING, maxZoom: 13, animate: false });
        setFramedKey(routingKey);
        return;
      }
      map.current.fitBounds(boundsOf(fitPoints.current), { padding: FRAME_PADDING, maxZoom: 13, duration: FLY_MS, linear: false });
      // fitBounds may not emit moveend when the viewport already matches.
      const timer = window.setTimeout(() => setFramedKey(routingKey), FLY_MS + 40);
      return () => clearTimeout(timer);
    }, [ready, streaming, routingKey, group]);

    // After framing, draw the route line once; later geometry changes update it in place.
    useEffect(() => {
      if (!ready || !map.current || streaming || framedKey !== routingKey) return;
      const instance = map.current;
      const positions = !props.route ? [] : streetPoints?.length ? streetPoints : fitPoints.current;
      linePoints.current = positions.length > 1 ? positions : [];
      if (positions.length < 2 || lineDrawn.current || reducedMotion()) {
        lineDrawn.current = positions.length > 1;
        setLine(instance, linePoints.current);
        return;
      }
      const start = performance.now();
      let frame = requestAnimationFrame(function draw(now) {
        const t = Math.min(1, (now - start) / DRAW_MS);
        setLine(instance, partialLine(positions, t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2));
        if (t < 1) frame = requestAnimationFrame(draw);
        else lineDrawn.current = true;
      });
      return () => { cancelAnimationFrame(frame); setLine(instance, linePoints.current); };
    }, [ready, framedKey, routingKey, streetPoints, props.route, streaming]);

    useEffect(() => {
      const frame = requestAnimationFrame(() => map.current?.resize());
      return () => cancelAnimationFrame(frame);
    }, [expanded]);

    const routeNote = routeKind === "street" ? "The line follows streets (OSRM / OpenStreetMap, driving profile); it is an overview, not turn-by-turn directions."
      : routeKind === "none" ? "" : "The line joins the places in order. Street routing is loading or unavailable.";
    const routeStatus = { street: "Street route loaded.", overview: "Street routing unavailable. Showing direct connections.", loading: "Street route loading.", none: "" }[routeKind];

    return (
      <div className="iui-map-slot" style={{ minHeight: height }}>
        <div
          ref={container}
          className={`iui-map${expanded ? " is-expanded" : ""}`}
          style={expanded ? undefined : { height }}
          role={expanded ? "dialog" : "region"}
          aria-modal={expanded || undefined}
          aria-label="Map"
          tabIndex={expanded ? -1 : undefined}
        >
          <div className="iui-map-surface" ref={surface} />
          <div className="iui-map-top-left">
            {categories.length > 1 && (
              <label className="iui-map-pill iui-map-filter">
                <select aria-label="Filter places" value={group} onChange={(event) => setGroup(event.target.value)}>
                  <option value="all">All places</option>
                  {categories.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg>
              </label>
            )}
            <button className="iui-map-pill iui-map-recenter" type="button" aria-label="Show every place" onClick={() => {
              if (fitPoints.current.length) map.current?.fitBounds(boundsOf(fitPoints.current), { padding: { top: 55, left: 34, bottom: 35, right: 40 }, maxZoom: 14 });
            }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="m4.5 4.5 15 5a1 1 0 0 1 0 1.9l-6.1 2-2 6.1a1 1 0 0 1-1.9 0l-5-15z"/></svg></button>
            <button className="iui-map-info" type="button" aria-label="About this map" aria-expanded={infoOpen} onClick={() => setInfoOpen(!infoOpen)}><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="10" cy="10" r="7"/><path d="M10 9v5"/><circle cx="10" cy="6.3" r=".6" fill="currentColor" stroke="none"/></svg></button>
          </div>
          <button className="iui-map-pill iui-map-expand" type="button" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? "Collapse" : "Expand"}<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M12 4h4v4M8 16H4v-4M16 12v4h-4M4 8V4h4"/></svg></button>
          {infoOpen && <div className="iui-map-note">Drag to explore and use + and − to zoom. Select a place to highlight it. {routeNote}</div>}
          {routeKind === "overview" && <div className="iui-map-overview">Route overview</div>}
          <span className="iui-map-status" role="status">{routeStatus}</span>
          {mapError && <div className="iui-map-error" role="status">Map tiles are temporarily unavailable. The places are still shown.</div>}
        </div>
      </div>
    );
  },
});

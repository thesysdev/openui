"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { defineComponent, useIsStreaming, useStateField } from "@openuidev/react-lang";
import type { Map as MapLibreMap } from "maplibre-gl";
import { useEffect, useId, useRef, useState } from "react";
import { useColorScheme } from "../scheme";
import { loadMapLibre, type MapLibre, rasterStyle, vectorStyle } from "./basemap";
import { MapControls, type RouteKind } from "./controls";
import { boundsOf, type LatLng, lngLat, reducedMotion } from "./map-utils";
import { type PinEntry, syncPins } from "./pins";
import { placesOf } from "./places";
import { animateLine, ensureRouteLayer, setLine } from "./route-line";
import { useDialog } from "./use-dialog";
import { useStreetRoute } from "./use-street-route";
import { createMapSchema, MapMarkerSchema } from "./schema";

export * from "./schema";

export const MapMarker = defineComponent({
  name: "MapMarker",
  props: MapMarkerSchema,
  description: "A place on a Map; icon is one emoji, else the pin shows its number.",
  component: () => null,
});

// Room for the controls on top and for labels, which hang below and beside each pin.
const FRAME_PADDING = { top: 70, left: 72, bottom: 50, right: 72 };

// "Show every place" frames the places a little tighter than the first fit.
const RECENTER_PADDING = { top: 55, left: 34, bottom: 35, right: 40 };

const FLY_MS = 920;

const DRAW_MS = 760;

export const MapView = defineComponent({
  name: "Map",
  props: createMapSchema(MapMarker),
  description: "Street map fitted to its markers. route draws the road path in marker order; selected holds the clicked marker's label.",
  component: function MapComponent({ props, statementId }) {
    const streaming = useIsStreaming();
    const fallbackId = useId();
    const selection = useStateField(statementId ?? `map-${fallbackId}`, props.selected);
    const selected = typeof selection.value === "string" ? selection.value : null;
    const container = useRef<HTMLDivElement>(null);
    const surface = useRef<HTMLDivElement>(null);
    const map = useRef<MapLibreMap | null>(null);
    const markers = useRef(new Map<string, PinEntry>());
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
    const routeKind: RouteKind = !props.route ? "none" : streetPoints?.length ? "street" : streetPoints === null ? "overview" : "loading";
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
        ensureRouteLayer(instance, ink);
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
      syncPins(lib, map.current, markers.current, visible, selected, (place) => {
        select.current(place.label);
        if (expandedNow.current) setExpanded(false);
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
      const stop = animateLine(instance, positions, DRAW_MS, () => { lineDrawn.current = true; });
      return () => { stop(); setLine(instance, linePoints.current); };
    }, [ready, framedKey, routingKey, streetPoints, props.route, streaming]);

    useEffect(() => {
      const frame = requestAnimationFrame(() => map.current?.resize());
      return () => cancelAnimationFrame(frame);
    }, [expanded]);

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
          <MapControls
            categories={categories}
            group={group}
            onGroup={setGroup}
            onRecenter={() => {
              if (fitPoints.current.length) map.current?.fitBounds(boundsOf(fitPoints.current), { padding: RECENTER_PADDING, maxZoom: 14 });
            }}
            infoOpen={infoOpen}
            onToggleInfo={() => setInfoOpen(!infoOpen)}
            expanded={expanded}
            onToggleExpand={() => setExpanded(!expanded)}
            routeKind={routeKind}
            mapError={mapError}
          />
        </div>
      </div>
    );
  },
});

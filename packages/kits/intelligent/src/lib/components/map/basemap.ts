import type { StyleSpecification } from "maplibre-gl";

export type MapLibre = typeof import("maplibre-gl");

/** Loads MapLibre on first use; Next emits its worker as a versioned same-origin asset. */
export async function loadMapLibre(): Promise<MapLibre> {
  const lib = await import("maplibre-gl");
  lib.setWorkerUrl(new URL("maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url).toString());
  return lib;
}

const LIGHT = {
  background: "#f4f2f0", green: "#bce9b0", park: "#b7e7aa", campus: "#ede8d7", water: "#a2dff5", waterway: "#91d6ef",
  building: "#e9e6e2", street: "#cdd1d9", road: "#b1b9c8", ferry: "#89cfe9", label: "#50545a", minor: "#687078", halo: "#ffffff",
};
const DARK = {
  background: "#1c1d1f", green: "#1f2b22", park: "#20301f", campus: "#26241f", water: "#1d3540", waterway: "#23414d",
  building: "#28292b", street: "#36393e", road: "#4b5058", ferry: "#2b5566", label: "#b4b9bf", minor: "#8d939a", halo: "#1c1d1f",
};

/** Restrained, destination-independent cartography using public OpenMapTiles geometry. */
export function vectorStyle(dark: boolean): StyleSpecification {
  const c = dark ? DARK : LIGHT;
  return {
    version: 8,
    glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
    sources: { places: { type: "vector", url: "https://tiles.openfreemap.org/planet", attribution: '<a href="https://openfreemap.org">OpenFreeMap</a> © <a href="https://www.openmaptiles.org">OpenMapTiles</a> · Data from <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' } },
    layers: [
      { id: "background", type: "background", paint: { "background-color": c.background } },
      { id: "landcover", type: "fill", source: "places", "source-layer": "landcover", filter: ["in", "class", "wood", "grass"], paint: { "fill-color": c.green, "fill-opacity": 0.8 } },
      { id: "parks", type: "fill", source: "places", "source-layer": "park", paint: { "fill-color": c.park } },
      { id: "school", type: "fill", source: "places", "source-layer": "landuse", filter: ["in", "class", "school", "university", "hospital"], paint: { "fill-color": c.campus } },
      { id: "water", type: "fill", source: "places", "source-layer": "water", paint: { "fill-color": c.water } },
      { id: "waterways", type: "line", source: "places", "source-layer": "waterway", paint: { "line-color": c.waterway, "line-width": 1 } },
      { id: "buildings", type: "fill", minzoom: 14, source: "places", "source-layer": "building", paint: { "fill-color": c.building } },
      { id: "streets", type: "line", source: "places", "source-layer": "transportation", filter: ["!in", "class", "rail", "transit", "ferry", "motorway", "trunk", "primary"], layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": c.street, "line-width": ["interpolate", ["linear"], ["zoom"], 9, 0.3, 12, 1.5, 14, 2.8, 17, 8] } },
      { id: "main-roads", type: "line", source: "places", "source-layer": "transportation", filter: ["in", "class", "motorway", "trunk", "primary"], layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": c.road, "line-width": ["interpolate", ["linear"], ["zoom"], 9, 0.7, 12, 3, 14, 5, 17, 12] } },
      { id: "ferries", type: "line", source: "places", "source-layer": "transportation", filter: ["==", "class", "ferry"], paint: { "line-color": c.ferry, "line-width": 0.8 } },
      { id: "neighborhood-labels", type: "symbol", source: "places", "source-layer": "place", minzoom: 10, maxzoom: 15, filter: ["in", "class", "suburb", "quarter", "neighbourhood"], layout: { "text-field": ["coalesce", ["get", "name_en"], ["get", "name"]], "text-font": ["Noto Sans Regular"], "text-size": 10, "text-letter-spacing": 0.08, "text-transform": "uppercase", "text-max-width": 8 }, paint: { "text-color": c.minor, "text-halo-color": c.halo, "text-halo-width": 1.2 } },
      { id: "city-labels", type: "symbol", source: "places", "source-layer": "place", minzoom: 7, maxzoom: 13, filter: ["in", "class", "city", "town"], layout: { "text-field": ["coalesce", ["get", "name_en"], ["get", "name"]], "text-font": ["Noto Sans Regular"], "text-size": 14, "text-max-width": 8 }, paint: { "text-color": c.label, "text-halo-color": c.halo, "text-halo-width": 1.5 } },
    ],
  };
}

/** Raster street tiles, used only if the vector basemap fails to load. */
export function rasterStyle(dark: boolean): StyleSpecification {
  const service = dark ? "Canvas/World_Dark_Gray_Base" : "World_Street_Map";
  return {
    version: 8,
    sources: { streets: { type: "raster", tiles: [`https://server.arcgisonline.com/ArcGIS/rest/services/${service}/MapServer/tile/{z}/{y}/{x}`], tileSize: 256, maxzoom: 19, attribution: "Tiles © Esri · OpenStreetMap contributors" } },
    layers: [{ id: "streets", type: "raster", source: "streets" }],
  };
}

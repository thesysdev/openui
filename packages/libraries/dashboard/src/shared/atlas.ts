import type { Feature, FeatureCollection, Geometry } from "geojson";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";

export type Shape = Feature<Geometry, { name: string }>;

const shapeCache: Partial<Record<"world" | "us", Promise<Shape[]>>> = {};

export function loadShapes(region: "world" | "us"): Promise<Shape[]> {
  shapeCache[region] ??= (
    region === "us"
      ? import("us-atlas/states-10m.json").then((module) => {
          const topology = (module.default ?? module) as unknown as Topology<{
            states: GeometryCollection<{ name: string }>;
          }>;
          return (
            feature(topology, topology.objects.states) as FeatureCollection<
              Geometry,
              { name: string }
            >
          ).features;
        })
      : import("world-atlas/countries-110m.json").then((module) => {
          const topology = (module.default ?? module) as unknown as Topology<{
            countries: GeometryCollection<{ name: string }>;
          }>;
          return (
            feature(topology, topology.objects.countries) as FeatureCollection<
              Geometry,
              { name: string }
            >
          ).features.filter((shape) => shape.properties.name !== "Antarctica");
        })
  ) as Promise<Shape[]>;
  return shapeCache[region]!;
}

/** Permit another mount to retry a failed atlas import. */
export function retryShapes(region: "world" | "us") {
  delete shapeCache[region];
}

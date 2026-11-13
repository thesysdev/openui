"use client";
import { defineComponent, type ComponentRenderProps } from "@openuidev/react-lang";
import { PointMap, type PointMapProps } from "../../../components/maps/PointMap";
import type { Covered, SchemaCoverage } from "../../schemaCoverage";
import { pointMapPropsSchema, type PointMapSchemaProps } from "./schema";
export const PointMapComponent = defineComponent({
  name: "PointMap",
  props: pointMapPropsSchema,
  description:
    'Values at places (stores, cities, offices, data centres) as circles sized by value (area, not radius) on a world or US map, with a ranked list beside it. lats/lons in degrees. previous adds each place\'s change, coloured by goodWhen. groups gives each place a type, drawn as its own colour and shape. valueLabel names the measure ("Headcount"). The 8 biggest places label themselves. For values by country or US state, use GeoMap; give it width two-thirds or full.',
  component: function PointMapView({ props }: ComponentRenderProps<PointMapSchemaProps>) {
    return <PointMap {...props} />;
  },
});

// Every schema field reaches PointMap.
export type PointMapSchemaCovered = Covered<SchemaCoverage<PointMapSchemaProps, PointMapProps>>;

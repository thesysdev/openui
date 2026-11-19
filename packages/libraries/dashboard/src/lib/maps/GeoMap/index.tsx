"use client";
import { defineComponent, type ComponentRenderProps } from "@openuidev/react-lang";
import { GeoMap, type GeoMapProps } from "../../../components/maps/GeoMap";
import type { Covered, SchemaCoverage } from "../../schemaCoverage";
import { geoMapPropsSchema, type GeoMapSchemaProps } from "./schema";
export const GeoMapComponent = defineComponent({
  name: "GeoMap",
  props: geoMapPropsSchema,
  description:
    'Choropleth with a ranked list of every region (limit keeps the top N). region "world" takes country names or ISO codes ("DE", "GBR"); "us" takes state names or codes ("NY"). A switch reads regions as counts or % of total (view "total" opens on shares); hovering the map or the list highlights the same region in both. Use width "two-thirds" or "full".',
  component: function GeoMapView({ props }: ComponentRenderProps<GeoMapSchemaProps>) {
    return <GeoMap {...props} />;
  },
});

// Every schema field reaches GeoMap.
export type GeoMapSchemaCovered = Covered<SchemaCoverage<GeoMapSchemaProps, GeoMapProps>>;

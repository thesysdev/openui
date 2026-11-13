"use client";
import { defineComponent, type ComponentRenderProps } from "@openuidev/react-lang";
import type { SmallMultiplesProps } from "../../../components/trends/SmallMultiples";
import { SmallMultiples } from "../../../components/trends/SmallMultiples";
import { nodeList } from "../../../shared/values";
import type { Covered, SchemaCoverage } from "../../schemaCoverage";
import type { SeriesSchemaProps } from "../Series/schema";
import { smallMultiplesPropsSchema, type SmallMultiplesSchemaProps } from "./schema";

export const SmallMultiplesComponent = defineComponent({
  name: "SmallMultiples",
  props: smallMultiplesPropsSchema,
  description:
    'A grid of small charts, one per series, on one shared scale, for more than 8 series, or when lines would tangle. Same unit across panels; never use it to mix units. type "area" (default) or "line"; columns fixes the grid (default fits ~180px panels). A Series\' previous draws the previous period as a grey dashed line in its panel while compare is on.',
  component: function SmallMultiplesView({
    props,
  }: ComponentRenderProps<SmallMultiplesSchemaProps>) {
    return <SmallMultiples {...props} series={nodeList<SeriesSchemaProps>(props.series)} />;
  },
});

// Every schema field reaches SmallMultiples.
export type SmallMultiplesSchemaCovered = Covered<
  SchemaCoverage<SmallMultiplesSchemaProps, SmallMultiplesProps>
>;

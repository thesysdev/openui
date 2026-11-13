"use client";
import { defineComponent } from "@openuidev/react-lang";
import { Donut, type DonutProps } from "../../../components/composition/Donut";
import type { Covered, SchemaCoverage } from "../../schemaCoverage";
import { donutPropsSchema, type DonutSchemaProps } from "./schema";
export const DonutComponent = defineComponent({
  name: "Donut",
  props: donutPropsSchema,
  description:
    "Part of a whole with the total as the headline, up to 8 parts; past 8, the smallest fold into Other. previous (last period's values, same order) adds each part's change in share, in points, to its tooltip while compare is on. For a compact strip, use SegmentedBar.",
  component: ({ props }) => <Donut {...props} />,
});

// Every schema field reaches Donut.
export type DonutSchemaCovered = Covered<SchemaCoverage<DonutSchemaProps, DonutProps>>;

"use client";
import { defineComponent } from "@openuidev/react-lang";
import { SegmentedBar, type SegmentedBarProps } from "../../../components/composition/SegmentedBar";
import type { Covered, SchemaCoverage } from "../../schemaCoverage";
import { segmentedBarPropsSchema, type SegmentedBarSchemaProps } from "./schema";
export const SegmentedBarComponent = defineComponent({
  name: "SegmentedBar",
  props: segmentedBarPropsSchema,
  description:
    "Part of a whole as one bar with a legend of values and shares; up to 8 parts. previous (last period's values, same order) adds each part's change in share, in points, to its tooltip while compare is on. Inside a headline tile, use Kpi split instead.",
  component: ({ props }) => <SegmentedBar {...props} />,
});

// Every schema field reaches SegmentedBar.
export type SegmentedBarSchemaCovered = Covered<
  SchemaCoverage<SegmentedBarSchemaProps, SegmentedBarProps>
>;

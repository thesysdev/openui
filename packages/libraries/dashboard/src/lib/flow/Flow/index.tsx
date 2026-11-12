"use client";
import { defineComponent } from "@openuidev/react-lang";
import { Flow, type FlowProps } from "../../../components/flow/Flow";
import type { Covered, SchemaCoverage } from "../../schemaCoverage";
import { flowPropsSchema, type FlowSchemaProps } from "./schema";
export const FlowComponent = defineComponent({
  name: "Flow",
  props: flowPropsSchema,
  description:
    'Sankey of a quantity between stages: links like {from: "Paid search", to: "Signed up", value: 1210}. Name loss nodes "Dropped", "Exited" or "Churned" (drawn grey). Links only move forward: one that loops back to an earlier node isn\'t drawn. Keep to ~4 columns and ~15 nodes. A link\'s previous (last period\'s volume) adds each link\'s and step\'s change to the tooltips while compare is on; give it on every link or none.',
  component: ({ props }) => <Flow {...props} />,
});

// Every schema field reaches Flow.
export type FlowSchemaCovered = Covered<SchemaCoverage<FlowSchemaProps, FlowProps>>;

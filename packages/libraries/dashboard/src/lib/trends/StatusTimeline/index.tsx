"use client";
import { defineComponent, type ComponentRenderProps } from "@openuidev/react-lang";
import type { StatusTimelineProps } from "../../../components/trends/StatusTimeline";
import { StatusTimeline } from "../../../components/trends/StatusTimeline";
import type { Covered, SchemaCoverage } from "../../schemaCoverage";
import { statusTimelinePropsSchema, type StatusTimelineSchemaProps } from "./schema";

export const StatusTimelineComponent = defineComponent({
  name: "StatusTimeline",
  props: statusTimelinePropsSchema,
  description:
    'Uptime per service over time: one strip per row, one cell per period. states[r][p] is "up", "degraded", "down", or "" for no data. Status colours, each named in the legend. periods labels the cells (days, hours).',
  component: function StatusTimelineView({
    props,
  }: ComponentRenderProps<StatusTimelineSchemaProps>) {
    return <StatusTimeline {...props} />;
  },
});

// Every schema field reaches StatusTimeline.
export type StatusTimelineSchemaCovered = Covered<
  SchemaCoverage<StatusTimelineSchemaProps, StatusTimelineProps>
>;

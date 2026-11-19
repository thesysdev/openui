"use client";
import { defineComponent, type ComponentRenderProps } from "@openuidev/react-lang";
import { useMemo } from "react";
import type { StatusTimelineProps } from "../../../components/trends/StatusTimeline";
import { StatusTimeline } from "../../../components/trends/StatusTimeline";
import { toGrid } from "../../../shared/values";
import type { Covered, SchemaCoverage } from "../../schemaCoverage";
import { statusTimelinePropsSchema, type StatusTimelineSchemaProps } from "./schema";

export const StatusTimelineComponent = defineComponent({
  name: "StatusTimeline",
  props: statusTimelinePropsSchema,
  description:
    'Uptime per service over time: one strip per service, one cell per period. labels, periods and states have one entry per cell: its service, its period and its state, as query rows give them: StatusTimeline(s.rows.service, s.rows.day, s.rows.state). A state is "good" (up), "warning" (degraded) or "bad" (down), or null for no data; the legend names them Up, Degraded and Down.',
  component: function StatusTimelineView({
    props,
  }: ComponentRenderProps<StatusTimelineSchemaProps>) {
    const grid = useMemo(
      () => toGrid<string>(props.labels, props.periods, props.states),
      [props.labels, props.periods, props.states],
    );
    return <StatusTimeline labels={grid.rows} periods={grid.columns} states={grid.cells} />;
  },
});

// Every schema field reaches StatusTimeline.
export type StatusTimelineSchemaCovered = Covered<
  SchemaCoverage<StatusTimelineSchemaProps, StatusTimelineProps>
>;

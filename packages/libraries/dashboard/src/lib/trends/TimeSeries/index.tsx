"use client";
import { defineComponent, type ComponentRenderProps } from "@openuidev/react-lang";
import { useMemo } from "react";
import type { TimeSeriesProps } from "../../../components/trends/TimeSeries";
import { TimeSeries } from "../../../components/trends/TimeSeries";
import { nodeList } from "../../../shared/values";
import type { Covered, SchemaCoverage } from "../../schemaCoverage";
import type { MarkerSchemaProps } from "../Marker/schema";
import type { ReferenceSchemaProps } from "../Reference/schema";
import type { SeriesSchemaProps } from "../Series/schema";
import { timeSeriesPropsSchema, type TimeSeriesSchemaProps } from "./schema";

export const TimeSeriesComponent = defineComponent({
  name: "TimeSeries",
  props: timeSeriesPropsSchema,
  description:
    'A metric over time. type "line" (default) for rates, "area" for volumes (stacked for parts of a whole; stacked "percent" for each part\'s share over time), "bar" for counts per period. Lines don\'t stack: stacked is ignored for "line". markers flag events on the time axis. curve "step" for values that change in steps (prices, limits, plan tiers). forecastFrom is the first projected label: from there the line is dashed and the region shaded.',
  component: function TimeSeriesView({ props }: ComponentRenderProps<TimeSeriesSchemaProps>) {
    const series = useMemo(() => nodeList<SeriesSchemaProps>(props.series), [props.series]);
    return (
      <TimeSeries
        {...props}
        series={series}
        references={nodeList<ReferenceSchemaProps>(props.references)}
        markers={nodeList<MarkerSchemaProps>(props.markers)}
      />
    );
  },
});

// Every schema field reaches TimeSeries.
export type TimeSeriesSchemaCovered = Covered<
  SchemaCoverage<TimeSeriesSchemaProps, TimeSeriesProps>
>;

"use client";

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { ColumnChart as ColumnChartView } from ".";
import { Pending } from "../../blocks/Pending/Pending.definition";
import { formatSchema, seriesSchema } from "../../core/schemas";

export const ColumnChart = defineComponent({
  name: "ColumnChart",
  description:
    'Columns over time or categories, grouped or stacked (negatives draw below zero); up to 8 series. Use it instead of BarChart: ColumnChart(mix.labels, [{name: "New", values: mix.newCustomers}, {name: "Returning", values: mix.returningCustomers}], "number", true, "Customers").',
  props: z.object({
    labels: z.array(z.string()).default([]),
    series: z.array(seriesSchema).default([]),
    format: formatSchema.optional(),
    stacked: z.boolean().optional(),
    yLabel: z.string().optional(),
  }),
  component: ({ props }) => {
    const labels = props.labels ?? [];
    // A series whose values have not arrived (a mid-stream or misnamed field)
    // is dropped, not drawn: the chart reads every series' values.
    const series = (props.series ?? []).filter((s) => Array.isArray(s?.values));
    if (labels.length === 0 || series.length === 0) return <Pending kind="columns" />;
    return (
      <ColumnChartView
        labels={labels}
        series={series}
        format={props.format}
        stacked={props.stacked}
        yLabel={props.yLabel}
        fill
      />
    );
  },
});

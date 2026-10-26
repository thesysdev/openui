"use client";

import { defineComponent, reactive, useStateField } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { HeroMetric as HeroMetricView } from "../components/HeroMetric";
import { passed, type Kpi, type Trend } from "../core/schemas";
import { Pending } from "./Pending";

export const HeroMetric = defineComponent({
  name: "HeroMetric",
  description:
    'The one number a dashboard leads with: the metric at hero size, its change against the comparison (prior period, last year, or plan), and a large trend against it with the gap shaded and events marked. Use exactly one, in a LargeCard at the top. Pass a KPI tool\'s hero, heroTrend, and metrics, plus a $binding shared with KpiStrip so selecting a tile shows that metric here: $metric = "" then HeroMetric(kpis.hero, kpis.heroTrend, kpis.metrics, $metric) and KpiStrip(kpis.metrics, $metric).',
  props: z.object({
    metric: passed("A KPI tool's hero"),
    trend: passed("Its heroTrend").optional(),
    metrics: z.array(passed("A KPI")).optional(),
    selected: reactive(z.string().optional()),
  }),
  component: ({ props }) => {
    const field = useStateField("heroMetric", props.selected);
    const hero = props.metric as unknown as Kpi | undefined;
    const trend = props.trend as unknown as Trend | undefined;
    // A Query's default (a label and an empty trend) is still loading.
    if (!hero?.label || (trend && !trend.labels?.length)) return <Pending kind="hero" />;
    return (
      <HeroMetricView
        metric={hero}
        trend={trend}
        metrics={props.metrics as unknown as Kpi[] | undefined}
        selected={typeof field.value === "string" ? field.value : undefined}
        onSelect={field.isReactive ? (label) => field.setValue(label) : undefined}
      />
    );
  },
});

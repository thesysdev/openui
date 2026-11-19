import { defineComponent } from "@openuidev/react-lang";
import type { KpiTrend } from "../../../components/metrics/Kpi";
import type { Covered, SchemaCoverage } from "../../schemaCoverage";
import { trendPropsSchema, type TrendSchemaProps } from "./schema";

// A Kpi's chart: Kpi reads its fields (lib/metrics/Kpi), so it draws nothing itself.
export const TrendComponent = defineComponent({
  name: "Trend",
  props: trendPropsSchema,
  description:
    "A Kpi's sparkline, 8–13 points. previous is the same points one period earlier, dashed while compare is on.",
  component: () => null,
});

// Every Trend field reaches Kpi, which reads it as KpiTrend.
export type TrendSchemaCovered = Covered<SchemaCoverage<TrendSchemaProps, KpiTrend>>;

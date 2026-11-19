import { defineComponent } from "@openuidev/react-lang";
import type { KpiSplit } from "../../../components/metrics/Kpi";
import type { Covered, SchemaCoverage } from "../../schemaCoverage";
import { splitPropsSchema, type SplitSchemaProps } from "./schema";

// A Kpi's chart: Kpi reads its fields (lib/metrics/Kpi), so it draws nothing itself.
export const SplitComponent = defineComponent({
  name: "Split",
  props: splitPropsSchema,
  description:
    "What a Kpi's total is made of, up to 3 parts, one label and one value each. For totals only, never rates or averages; a card about composition is a SegmentedBar.",
  component: () => null,
});

// Every Split field reaches Kpi, which reads it as KpiSplit.
export type SplitSchemaCovered = Covered<SchemaCoverage<SplitSchemaProps, KpiSplit>>;

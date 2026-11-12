import { defineComponent } from "@openuidev/react-lang";
import { splitPropsSchema } from "./schema";

// A Kpi's chart: Kpi reads its fields (lib/metrics/Kpi), so it draws nothing itself.
export const SplitComponent = defineComponent({
  name: "Split",
  props: splitPropsSchema,
  description:
    "What a Kpi's total is made of, up to 3 parts. For totals only, never rates or averages; a card about composition is a SegmentedBar.",
  component: () => null,
});

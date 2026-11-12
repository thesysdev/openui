import { defineComponent } from "@openuidev/react-lang";
import { trendPropsSchema } from "./schema";

// A Kpi's chart: Kpi reads its fields (lib/metrics/Kpi), so it draws nothing itself.
export const TrendComponent = defineComponent({
  name: "Trend",
  props: trendPropsSchema,
  description:
    "A Kpi's sparkline, 8–13 points. previous is the same points one period earlier, dashed while compare is on.",
  component: () => null,
});

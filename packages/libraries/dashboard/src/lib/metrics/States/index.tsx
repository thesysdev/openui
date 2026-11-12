import { defineComponent } from "@openuidev/react-lang";
import { statesPropsSchema } from "./schema";

// A Kpi's chart: Kpi reads its fields (lib/metrics/Kpi), so it draws nothing itself.
export const StatesComponent = defineComponent({
  name: "States",
  props: statesPropsSchema,
  description: "A Kpi's status strip: one dot per period, null for no data.",
  component: () => null,
});

import { defineComponent } from "@openuidev/react-lang";
import type { KpiStates } from "../../../components/metrics/Kpi";
import type { Covered, SchemaCoverage } from "../../schemaCoverage";
import { statesPropsSchema, type StatesSchemaProps } from "./schema";

// A Kpi's chart: Kpi reads its fields (lib/metrics/Kpi), so it draws nothing itself.
export const StatesComponent = defineComponent({
  name: "States",
  props: statesPropsSchema,
  description: "A Kpi's status strip: one dot per period, null for no data.",
  component: () => null,
});

// Every States field reaches Kpi, which reads it as KpiStates.
export type StatesSchemaCovered = Covered<SchemaCoverage<StatesSchemaProps, KpiStates>>;

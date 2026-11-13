import { defineComponent } from "@openuidev/react-lang";
import type { KpiProgress } from "../../../components/metrics/Kpi";
import type { Covered, SchemaCoverage } from "../../schemaCoverage";
import { progressPropsSchema, type ProgressSchemaProps } from "./schema";

// A Kpi's chart: Kpi reads its fields (lib/metrics/Kpi), so it draws nothing itself.
export const ProgressComponent = defineComponent({
  name: "Progress",
  props: progressPropsSchema,
  description:
    'A Kpi\'s progress toward target (a limit when its goodWhen is "down"). For one headline number; several targets in a card are Goals.',
  component: () => null,
});

// Every Progress field reaches Kpi, which reads it as KpiProgress.
export type ProgressSchemaCovered = Covered<SchemaCoverage<ProgressSchemaProps, KpiProgress>>;

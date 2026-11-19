import { z } from "zod/v4";
import { KpiComponent } from "../Kpi";

export const kpisPropsSchema = z.object({
  items: z.array(KpiComponent.ref),
});
export type KpisSchemaProps = z.infer<typeof kpisPropsSchema>;

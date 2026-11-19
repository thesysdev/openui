import { z } from "zod/v4";
import { DASHBOARD_CHILDREN, oneOf, refs } from "../../slots";
import { SectionComponent } from "../Section";

export const dashboardPropsSchema = z.object({
  children: z.array(oneOf([...refs(DASHBOARD_CHILDREN), SectionComponent.ref as z.ZodType])),
});
export type DashboardSchemaProps = z.infer<typeof dashboardPropsSchema>;

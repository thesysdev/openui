import { z } from "zod/v4";
import { DashboardHeaderComponent } from "../DashboardHeader/DashboardHeader";
import { SectionComponent } from "../Section/Section";

export const dashboardChildSchema = z.union([DashboardHeaderComponent.ref, SectionComponent.ref]);

export const dashboardPropsSchema = z.object({
  children: z
    .array(dashboardChildSchema)
    .min(1)
    .check((payload) => {
      const hasSection = payload.value.some(
        (child) => z.safeParse(SectionComponent.ref, child).success,
      );

      if (!hasSection) {
        payload.issues.push({
          code: "custom",
          message: "Dashboard must contain at least one Section.",
          input: payload.value,
        });
      }
    }),
});

export type DashboardProps = z.infer<typeof dashboardPropsSchema>;

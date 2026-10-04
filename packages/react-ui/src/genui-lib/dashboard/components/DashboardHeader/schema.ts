import { z } from "zod/v4";
import { IconButtonComponent } from "../IconButton/IconButton";

export const dashboardHeaderControlSchema = z.union([IconButtonComponent.ref]);

export const dashboardHeaderPropsSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  controls: z.array(dashboardHeaderControlSchema).max(2).optional(),
});

export type DashboardHeaderProps = z.infer<typeof dashboardHeaderPropsSchema>;

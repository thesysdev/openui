import { z } from "zod/v4";
import { IconButtonComponent } from "../IconButton/IconButton";

export const dashboardCardHeaderControlSchema = z.union([IconButtonComponent.ref]);

export const dashboardCardHeaderPropsSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  titleType: z.enum(["text", "number"]).default("text"),
  controls: z.array(dashboardCardHeaderControlSchema).max(2).optional(),
});

export type DashboardCardHeaderProps = z.infer<typeof dashboardCardHeaderPropsSchema>;

import { z } from "zod/v4";
import { MetricIndicatorComponent } from "../MetricIndicator";
export const smallCardBottomSchema = z.union([MetricIndicatorComponent.ref]);

export const smallCardPropsSchema = z.object({
  top: z.any(),
  bottom: z.any().optional(),
  trend: z.any().optional(),
});

export type SmallCardProps = z.infer<typeof smallCardPropsSchema>;

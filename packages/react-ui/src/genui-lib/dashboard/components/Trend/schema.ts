import { z } from "zod/v4";

export const trendPropsSchema = z.object({
  direction: z.enum(["up", "down"]),
  value: z.number(),
});

export type TrendProps = z.infer<typeof trendPropsSchema>;

/** The normalized trend shape renderers consume (see `resolveTrend`). */
export interface TrendValue {
  direction: "up" | "down";
  value: number;
}

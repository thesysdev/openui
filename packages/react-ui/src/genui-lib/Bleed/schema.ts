import { z } from "zod/v4";
import { getShellChildUnion } from "../Shell/schema";

// Same children as a Shell: content, Card, Grid, Carousel, Stack, Tabs.
export const BleedSchema = z.object({
  get children(): z.ZodArray<z.ZodType> {
    return z.array(getShellChildUnion());
  },
});

export type BleedProps = z.infer<typeof BleedSchema>;

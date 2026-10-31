import { z } from "zod/v4";
import { children } from "../helpers";

export const CarouselSchema = z.object({
  children,
  itemWidth: z.number().optional(),
  gap: z.number().optional(),
});

export type CarouselProps = z.infer<typeof CarouselSchema>;

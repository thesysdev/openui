import { z } from "zod/v4";
import { CardSchema } from "../Card/schema";
import { Carousel } from "../Carousel";
import { Stack } from "../Stack";
import { Tabs } from "../Tabs";
import { ContentChildUnion } from "../unions";

// Anything a Section holds, plus Card. Built on first use because Card and
// Section hold a Grid in turn.
let gridChildUnion: z.ZodType | undefined;
export const getGridChildUnion = (): z.ZodType =>
  (gridChildUnion ??= z.union([
    ...ContentChildUnion.options,
    CardSchema,
    Tabs.ref,
    Carousel.ref,
    Stack.ref,
  ]));

export const GridSchema = z.object({
  get children(): z.ZodArray<z.ZodType> {
    return z.array(getGridChildUnion());
  },
  columns: z.union([z.literal(2), z.literal(3), z.literal(4)]).optional(),
});

export type GridProps = z.infer<typeof GridSchema>;

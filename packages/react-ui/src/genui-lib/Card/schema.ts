import { z } from "zod";
import { Carousel } from "../Carousel";
import { Stack } from "../Stack";
import { FlexPropsSchema } from "../Stack/schema";
import { Tabs } from "../Tabs";
import { ContentChildUnion } from "../unions";

export const CardChildUnion = z.union([
  ...ContentChildUnion.options,
  Tabs.ref,
  Carousel.ref,
  Stack.ref,
]);

export const CardSchema = z
  .object({
    children: z.array(CardChildUnion),
    variant: z.enum(["card", "sunk", "clear"]).optional(),
  })
  .merge(FlexPropsSchema);

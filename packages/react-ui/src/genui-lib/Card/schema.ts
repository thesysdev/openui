import { z } from "zod/v4";
import { Bleed } from "../Bleed";
import { Carousel } from "../Carousel";
import { Grid } from "../Grid";
import { Section } from "../Section";
import { Shell } from "../Shell";
import { Stack } from "../Stack";
import { Tabs } from "../Tabs";
import { ContentChildUnion } from "../unions";

// Card and Carousel hold each other (a Carousel's slides are Cards), so the
// union is built on first use rather than at import time.
let cardChildUnion: z.ZodType | undefined;
export const getCardChildUnion = (): z.ZodType =>
  (cardChildUnion ??= z.union([
    ...ContentChildUnion.options,
    Tabs.ref,
    Carousel.ref,
    Stack.ref,
    Section.ref,
    Grid.ref,
    Shell.ref,
    Bleed.ref,
  ]));

export const CardSchema = z.object({
  get children(): z.ZodArray<z.ZodType> {
    return z.array(getCardChildUnion());
  },
  variant: z.enum(["outlined", "lifted", "sunk"]).optional(),
  // After variant so existing Card(children, variant) calls keep their meaning.
  title: z.string().optional(),
  subtitle: z.string().optional(),
});

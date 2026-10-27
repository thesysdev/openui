import { z } from "zod/v4";
import { Bleed } from "../Bleed";
import { Carousel } from "../Carousel";
import { FollowUpBlock } from "../FollowUpBlock";
import { Grid } from "../Grid";
import { Shell } from "../Shell";
import { Sources } from "../Sources";
import { Stack } from "../Stack";
import { Tabs } from "../Tabs";
import { ContentChildUnion } from "../unions";

// Same children a Card takes, minus Section itself (no nesting). Built on
// first use because Carousel reaches back to Card, which holds Section.
let sectionChildUnion: z.ZodType | undefined;
export const getSectionChildUnion = (): z.ZodType =>
  (sectionChildUnion ??= z.union([
    ...ContentChildUnion.options,
    Tabs.ref,
    Carousel.ref,
    Stack.ref,
    Grid.ref,
    Shell.ref,
    Bleed.ref,
    // Response endings: they close the final Section.
    FollowUpBlock.ref,
    Sources.ref,
  ]));

export const SectionSchema = z.object({
  get children(): z.ZodArray<z.ZodType> {
    return z.array(getSectionChildUnion());
  },
});

export type SectionProps = z.infer<typeof SectionSchema>;

import { z } from "zod/v4";
import { CardSchema } from "../Card/schema";
import { Carousel } from "../Carousel";
import { Grid } from "../Grid";
import { Stack } from "../Stack";
import { Tabs } from "../Tabs";
import { ContentChildUnion } from "../unions";

// What a Card or Section holds, plus Card and Grid. Built on first use
// because Card and Section hold a Shell in turn.
let shellChildUnion: z.ZodType | undefined;
export const getShellChildUnion = (): z.ZodType =>
  (shellChildUnion ??= z.union([
    ...ContentChildUnion.options,
    CardSchema,
    Grid.ref,
    Tabs.ref,
    Carousel.ref,
    Stack.ref,
  ]));

export const ShellSchema = z.object({
  title: z.string(),
  get children(): z.ZodArray<z.ZodType> {
    return z.array(getShellChildUnion());
  },
});

export type ShellProps = z.infer<typeof ShellSchema>;

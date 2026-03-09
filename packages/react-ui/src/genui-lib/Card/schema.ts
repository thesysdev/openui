import { z } from "zod";
import { Carousel } from "../Carousel";
import { Tabs } from "../Tabs";
import { ContentChildUnion } from "../unions";

export const CardChildUnion = z.union([...ContentChildUnion.options, Tabs.ref, Carousel.ref]);

export const CardSchema = z.object({
  children: z.array(CardChildUnion),
  variant: z.enum(["card", "sunk", "clear"]).optional(),
});

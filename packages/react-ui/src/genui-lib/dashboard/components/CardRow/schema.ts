import { z } from "zod/v4";
import { LargeCardComponent } from "../LargeCard/LargeCard";
import { MediumCardComponent } from "../MediumCard/MediumCard";
import { SmallCardComponent } from "../SmallCard/SmallCard";

export const cardRowChildSchema = z
  .array(z.union([SmallCardComponent.ref, MediumCardComponent.ref, LargeCardComponent.ref]))
  .default([]);

export const cardRowPropsSchema = z.object({
  children: cardRowChildSchema,
  align: z.enum(["start", "stretch"]).default("stretch"),
});

export type CardRowProps = z.infer<typeof cardRowPropsSchema>;

import { z } from "zod/v4";
import { EntityListItem, type EntityListItemProps } from "../EntityListItem";

export const EntityListSchema = z
  .object({
    rows: z.array(EntityListItem.ref).default([]),
    size: z.enum(["small", "default"]).default("default"),
    header: z.optional(EntityListItem.ref),
    footer: z.optional(EntityListItem.ref),
  })
  .refine(({ size, header, footer }) => size === "default" || (!header && !footer), {
    message: 'EntityList size="small" does not support header or footer.',
    path: ["size"],
  });

export type EntityListRow = EntityListItemProps;
export type EntityListProps = z.infer<typeof EntityListSchema>;

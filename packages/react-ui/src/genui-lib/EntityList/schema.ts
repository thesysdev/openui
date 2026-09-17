import { z } from "zod/v4";

export const EntityListRowSchema = z.object({
  left: z.string(),
  right: z.string(),
  rightVariant: z.enum(["text", "number"]).default("text"),
});

export const EntityListSchema = z
  .object({
    rows: z.array(EntityListRowSchema).default([]),
    size: z.enum(["small", "default"]).default("default"),
    header: EntityListRowSchema.optional(),
    footer: EntityListRowSchema.optional(),
  })
  .refine(({ size, header, footer }) => size === "default" || (!header && !footer), {
    message: 'EntityList size="small" does not support header or footer.',
    path: ["size"],
  });

export type EntityListRow = z.infer<typeof EntityListRowSchema>;
export type EntityListProps = z.infer<typeof EntityListSchema>;

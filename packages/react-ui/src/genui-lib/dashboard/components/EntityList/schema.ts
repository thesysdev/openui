import { z } from "zod/v4";

export const entityListRowSchema = z.object({
  left: z.string(),
  right: z.string(),
  rightVariant: z.enum(["text", "number"]).default("text"),
});

export const entityListPropsSchema = z
  .object({
    rows: z.array(entityListRowSchema).default([]),
    size: z.enum(["small", "default"]).default("default"),
    header: entityListRowSchema.optional(),
    footer: entityListRowSchema.optional(),
  })
  .check((payload) => {
    const { size, header, footer } = payload.value;
    if (size !== "default" && (header || footer)) {
      payload.issues.push({
        code: "custom",
        message: 'EntityList size="small" does not support header or footer.',
        input: payload.value,
        path: ["size"],
      });
    }
  });

export type EntityListRow = z.infer<typeof entityListRowSchema>;
export type EntityListProps = z.infer<typeof entityListPropsSchema>;

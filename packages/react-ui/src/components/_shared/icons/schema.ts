import { z } from "zod/v4";

/**
 * The icon wire contract shared by every surface that embeds an `Icon`
 * (chat + dashboard `Icon` components). Field order is wire-load-bearing
 * (openui-lang binds positionally): `name` first, `category` second — never
 * reorder.
 *
 * Report/presentation blocks intentionally use a flat `iconName` field
 * instead (it shipped positionally before this schema existed here).
 */
export const iconPropsSchema = z.object({
  name: z
    .string()
    .describe("lucide-react icon name in kebab-case (e.g. 'circle-check', 'rocket')."),
  category: z
    .string()
    .optional()
    .describe(
      "Optional icon category (e.g. 'finance', 'charts', 'security', 'travel', 'people', 'time') used to pick a topical fallback icon when `name` doesn't resolve.",
    ),
});

export type IconProps = z.infer<typeof iconPropsSchema>;

import { z } from "zod/v4";
/**
 * The icon wire contract. Field order is load-bearing — openui-lang binds
 * positionally, so `name` must stay first and `category` second.
 *
 * This stays in the kit rather than coming from `@openuidev/react-components`:
 * that package exports the icon COMPONENTS (IconWrapper, IconTag, IconText)
 * but no zod schema, and the schema is what the model is prompted against.
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

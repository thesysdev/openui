import { z } from "zod/v4";
import { IconTextComponent } from "../IconText/IconText";
import { MetricIndicatorComponent } from "../MetricIndicator/MetricIndicator";
import { TrendComponent } from "../Trend/Trend";

// Snippet-card left side. The renderer keys the snippet form off a raw
// object with a string `title` (`isSnippetLhs` in SmallCard.tsx). `icon` is
// a lucide icon name string rendered in an IconTag (IconTagView also accepts
// an Icon(...) element at runtime, but the schema — what the LLM sees — only
// advertises the string form); `imageSrc` is the image alternative when
// there is no icon.
export const smallCardSnippetLhsSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  icon: z.string().optional(),
  iconVariant: z.enum(["neutral", "info", "success", "warning", "danger", "inverted"]).optional(),
  imageSrc: z.string().optional(),
  imageAlt: z.string().optional(),
});

// Snippet-card right side — one emphasized value (`isSnippetRhs` keys off
// the string `value`). `subtextVariant: "metric"` renders a +/--prefixed
// subtext in positive/negative tone.
export const smallCardSnippetRhsSchema = z.object({
  value: z.string(),
  subtext: z.string().optional(),
  variant: z.enum(["text", "number", "textOnly"]).optional(),
  subtextVariant: z.enum(["text", "metric"]).optional(),
});

// trend is a Trend(direction, value) child component (positional-only
// authoring). The renderer's `resolveTrend` still accepts the legacy raw
// `{direction, value}` object at runtime, but the schema — what the LLM sees —
// only advertises the child-component form.
//
// top/bottom encode SmallCard's three forms, pairing positionally:
//   string top    + string bottom            → overview card (title, metric)
//   IconText top  + MetricIndicator[] bottom → overview card with icon
//   lhs-object top + rhs-object bottom       → snippet card
// The pairing itself (top form X must pair with bottom form X) is not
// expressible per-field — it stays in the description prose.
export const smallCardPropsSchema = z.object({
  top: z.union([z.string(), IconTextComponent.ref, smallCardSnippetLhsSchema]),
  bottom: z.optional(
    z.union([z.string(), z.array(MetricIndicatorComponent.ref), smallCardSnippetRhsSchema]),
  ),
  trend: z.optional(TrendComponent.ref),
});

export type SmallCardProps = z.infer<typeof smallCardPropsSchema>;

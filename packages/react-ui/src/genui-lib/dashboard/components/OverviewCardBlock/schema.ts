import { z } from "zod/v4";
import { TrendComponent } from "../Trend/Trend";

// trend is a Trend(direction, value) child component (positional-only
// authoring). The renderer's `resolveTrend` still accepts the legacy raw
// `{direction, value}` object at runtime, but the schema — what the LLM sees —
// only advertises the child-component form.
// PROP ORDER IS THE POSITIONAL CALLING CONVENTION. The high-value args come
// FIRST so the common call — OverviewCardItem("MRR", "$48.2K", "USD",
// Trend("up", 12.5)) — needs NO interior placeholders. Burying `value` behind
// five optionals made models miscount placeholders and shift a Trend node
// into a string slot (render crash, eval case tabs-request).
export const overviewCardItemPropsSchema = z.object({
  title: z.string(),
  value: z.string().optional(),
  valueSubtext: z.string().optional(),
  trend: z.optional(TrendComponent.ref),
  subtitle: z.string().optional(),
  icon: z.string().optional(),
  imageSrc: z.string().optional(),
  imageAlt: z.string().optional(),
  id: z.string().optional(),
});

export type OverviewCardItemProps = z.infer<typeof overviewCardItemPropsSchema>;

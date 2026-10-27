import { z } from "zod/v4";
import { LeadingText } from "../LeadingText";
import { Link } from "../Link";
import { Metric } from "../Metric";
import { Tag } from "../Tag";
import { TagBlock } from "../TagBlock";
import { Text } from "../Text";
import { oneOrMany } from "../oneOrMany";

export const StepsItemSchema = z.object({
  title: oneOrMany(z.string(), Text.ref, Link.ref, Tag.ref),
  subtitle: oneOrMany(
    z.string(),
    Text.ref,
    Metric.ref,
    Tag.ref,
    TagBlock.ref,
    LeadingText.ref,
    Link.ref,
  ).optional(),
});

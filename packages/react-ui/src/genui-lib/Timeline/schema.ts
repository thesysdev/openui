import { z } from "zod/v4";
import { Avatar } from "../Avatar";
import { Emoji } from "../Emoji";
import { Icon } from "../Icon";
import { LeadingText } from "../LeadingText";
import { Link } from "../Link";
import { Metric } from "../Metric";
import { Tag } from "../Tag";
import { TagBlock } from "../TagBlock";
import { Text } from "../Text";
import { oneOrMany } from "../oneOrMany";

export const TimelineItemSchema = z.object({
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
  time: oneOrMany(z.string(), Text.ref, Tag.ref).optional(),
  leading: z.union([Avatar.ref, Icon.ref, Emoji.ref]).optional(),
  status: z.enum(["done", "current", "upcoming"]).optional(),
});

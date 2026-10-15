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

export const EntityTitleSchema = z.object({
  leading: z.union([Avatar.ref, Icon.ref, Emoji.ref]),
  title: z.string(),
  subtitle: oneOrMany(
    z.string(),
    Text.ref,
    Metric.ref,
    Tag.ref,
    TagBlock.ref,
    LeadingText.ref,
    Link.ref,
  ),
  layout: z.enum(["horizontal", "vertical"]).optional(),
});

export type EntityTitleProps = z.infer<typeof EntityTitleSchema>;

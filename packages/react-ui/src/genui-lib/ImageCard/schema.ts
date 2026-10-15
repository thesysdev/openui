import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { actionPropSchema } from "../Action/schema";
import { Avatar } from "../Avatar";
import { Emoji } from "../Emoji";
import { Icon } from "../Icon";
import { IconButton } from "../IconButton";
import { LeadingText } from "../LeadingText";
import { Link } from "../Link";
import { Metric } from "../Metric";
import { oneOrMany } from "../oneOrMany";
import { Tag } from "../Tag";
import { Text } from "../Text";

export const ImageCardItemSchema = z.object({
  id: z.string().optional(),
  src: z.string(),
  title: z.string(),
  subtitle: oneOrMany(
    z.string(),
    Text.ref,
    Metric.ref,
    Tag.ref,
    LeadingText.ref,
    Link.ref,
  ).optional(),
  overline: z.string().optional(),
  leading: z.union([Avatar.ref, Icon.ref, Emoji.ref]).optional(),
  alt: z.string().optional(),
  actions: z.union([IconButton.ref, z.array(IconButton.ref)]).optional(),
});

export type ImageCardItemProps = z.infer<typeof ImageCardItemSchema>;

export const ImageCardItem = defineComponent({
  name: "ImageCardItem",
  props: ImageCardItemSchema,
  description:
    'One tall photo tile: ImageCardItem(id?, src, title, subtitle?, overline?, leading?, alt?, actions?), e.g. ImageCardItem("eiffel-tower", "https://…/eiffel.jpg", "Eiffel Tower", ["Open daily 9am–midnight", Tag("Must-See", null, "info")], null, null, "Aerial view of the Eiffel Tower"). src is a real image URL from a tool result or the user, never invented, shown full-bleed behind the text with dark gradients so the white text stays readable. overline is an optional short label at the top left (a category such as "Museum"), with leading (an Icon, Avatar or Emoji) before it. title (22px) is the name of the place or item, and subtitle sits under it: a string, Text, Metric, Tag, LeadingText or Link, or an array of them on one line. actions are optional IconButtons at the top right, only for something that really happens: an @OpenUrl to the item\'s own page from a tool result, or a @ToAssistant follow-up such as IconButton("Hotels nearby", Icon("bed", "travel"), @ToAssistant("Show hotels near the Eiffel Tower")); never save, share or download, which you cannot perform. alt describes the photo.',
  component: () => null,
});

export const ImageCardSchema = z.object({
  items: z.array(ImageCardItem.ref).min(2),
  layout: z.enum(["grid", "carousel"]).optional(),
  responsive: z.boolean().optional(),
  action: actionPropSchema.optional(),
  gap: z.union([z.number(), z.string()]).optional(),
});

export type ImageCardProps = z.infer<typeof ImageCardSchema>;

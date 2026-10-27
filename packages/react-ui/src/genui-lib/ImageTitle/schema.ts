import { z } from "zod/v4";
import { EntityTitle } from "../EntityTitle";
import { Heading } from "../Heading";
import { Image } from "../Image";
import { LeadingText } from "../LeadingText";
import { Link } from "../Link";
import { Metric } from "../Metric";
import { Tag } from "../Tag";
import { TagBlock } from "../TagBlock";
import { Text } from "../Text";
import { oneOrMany } from "../oneOrMany";

export const ImageTitleSchema = z.object({
  image: Image.ref,
  // Each line is one item, or an array of items shown side by side.
  content: z.array(
    oneOrMany(
      Text.ref,
      Heading.ref,
      EntityTitle.ref,
      LeadingText.ref,
      Metric.ref,
      Tag.ref,
      TagBlock.ref,
      Link.ref,
    ),
  ),
});

export type ImageTitleProps = z.infer<typeof ImageTitleSchema>;

import type { SubComponentOf } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { Tag as OpenUITag } from "../components/Tag";
import { renderIconSlot } from "./iconSlot";
import type { TagSchema } from "./Tag";

type TagProps = z.infer<typeof TagSchema>;

/** Renders a `Tag` element ref, as used inside card blocks. */
export function renderCardTag(tag: SubComponentOf<TagProps> | undefined, key?: string) {
  if (!tag) return null;
  const { text, variant, leading } = tag.props;

  return (
    <OpenUITag
      key={key}
      text={text}
      variant={variant ?? "neutral"}
      icon={renderIconSlot(leading)}
    />
  );
}

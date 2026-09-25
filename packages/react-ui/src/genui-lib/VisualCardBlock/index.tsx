"use client";

import type { SubComponentOf } from "@openuidev/react-lang";
import {
  ComponentRenderProps,
  defineComponent,
  useFormName,
  useIsStreaming,
  useTriggerAction,
} from "@openuidev/react-lang";
import { VisualCardBlock as OpenUIVisualCardBlock } from "../../components/VisualCardBlock";
import { withItemContext } from "../cardActionUtils";
import { renderCardTag } from "../cardTagUtils";
import {
  VisualCardBlockSchema,
  type VisualCardBlockProps,
  type VisualCardItemProps,
} from "./schema";

export * from "./schema";

type VisualCardItemElement = SubComponentOf<VisualCardItemProps>;

function VisualCardBlockRenderer({
  props,
  renderNode,
}: ComponentRenderProps<VisualCardBlockProps>) {
  const triggerAction = useTriggerAction();
  const formName = useFormName();
  const isStreaming = useIsStreaming();

  const items = (props.items ?? []) as VisualCardItemElement[];
  const isClickable = Boolean(props.action) && !isStreaming;

  const handleItemClick = (index: number) => {
    const item = items[index];
    if (!item || !props.action || isStreaming) return;

    const { id, body, tag, bgImageSrc, bgImageAlt } = item.props;
    const bodyValue = body?.props?.value;
    const tagText = tag?.props?.text;
    triggerAction(
      bodyValue || tagText || id || `Visual card ${index + 1}`,
      formName,
      withItemContext(props.action, {
        itemIndex: index,
        itemId: id,
        itemTag: tagText,
        itemBody: bodyValue,
        itemBodySubtext: body?.props?.subtext,
        itemBgImageSrc: bgImageSrc,
        itemBgImageAlt: bgImageAlt,
      }),
    );
  };

  return (
    <OpenUIVisualCardBlock
      layout={props.layout ?? "grid"}
      responsive={props.responsive !== false}
      gap={props.gap}
      clickable={isClickable}
      onItemClick={handleItemClick}
      items={items.map((item, index) => {
        const { id, body, tag, bgImageSrc, bgImageAlt } = item.props;
        return {
          id,
          tag: renderCardTag(tag, `visual-card-tag-${index}`),
          body: body ? renderNode(body) : null,
          bgImageSrc,
          bgImageAlt,
        };
      })}
    />
  );
}

export const VisualCardBlock = defineComponent({
  name: "VisualCardBlock",
  props: VisualCardBlockSchema,
  description:
    "A grid or carousel of photo-first cards: a full-bleed background image with a tag on top and a bold text panel at the bottom; an optional action makes every card clickable.",
  component: VisualCardBlockRenderer,
});

"use client";

import type { SubComponentOf } from "@openuidev/react-lang";
import {
  ComponentRenderProps,
  defineComponent,
  useFormName,
  useIsStreaming,
  useTriggerAction,
} from "@openuidev/react-lang";
import { ContextCardBlock as OpenUIContextCardBlock } from "../../components/ContextCardBlock";
import { withItemContext } from "../cardActionUtils";
import { renderCardTag } from "../cardTagUtils";
import {
  ContextCardBlockSchema,
  type ContextCardBlockProps,
  type ContextCardItemProps,
} from "./schema";

export * from "./schema";

type ContextCardItemElement = SubComponentOf<ContextCardItemProps>;

function getContextTitleText(item: ContextCardItemElement) {
  const { title } = item.props;
  if (!title) return "";
  return typeof title === "string" ? title : (title.props?.text ?? "");
}

function ContextCardBlockRenderer({ props }: ComponentRenderProps<ContextCardBlockProps>) {
  const triggerAction = useTriggerAction();
  const formName = useFormName();
  const isStreaming = useIsStreaming();

  const items = (props.items ?? []) as ContextCardItemElement[];
  const isClickable = Boolean(props.action) && !isStreaming;

  const handleItemClick = (index: number) => {
    const item = items[index];
    if (!item || !props.action || isStreaming) return;

    const { id, body, bgColor, bgImageSrc, bgImageAlt } = item.props;
    triggerAction(
      getContextTitleText(item) || id || `Context card ${index + 1}`,
      formName,
      withItemContext(props.action, {
        itemIndex: index,
        itemId: id,
        itemTitle: getContextTitleText(item),
        itemBody: body,
        itemBgColor: bgColor,
        itemBgImageSrc: bgImageSrc,
        itemBgImageAlt: bgImageAlt,
      }),
    );
  };

  return (
    <OpenUIContextCardBlock
      layout={props.layout ?? "grid"}
      responsive={props.responsive !== false}
      gap={props.gap}
      clickable={isClickable}
      onItemClick={handleItemClick}
      items={items.map((item, index) => {
        const { id, title, body, bgColor, bgImageSrc, bgImageAlt } = item.props;
        return {
          id,
          title:
            typeof title === "string" ? title : renderCardTag(title, `context-card-tag-${index}`),
          body,
          bgColor,
          bgImageSrc,
          bgImageAlt,
        };
      })}
    />
  );
}

export const ContextCardBlock = defineComponent({
  name: "ContextCardBlock",
  props: ContextCardBlockSchema,
  description:
    "A grid or carousel of compact tinted context cards (title or tag plus a short bold body); an optional action makes every card clickable.",
  component: ContextCardBlockRenderer,
});

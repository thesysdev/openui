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
import { insightContent, insightOverline } from "../InsightCard";
import { renderOneOrMany } from "../oneOrMany";
import { ImageCardSchema, type ImageCardItemProps, type ImageCardProps } from "./schema";

export * from "./schema";

type ImageCardItemElement = SubComponentOf<ImageCardItemProps>;

function ImageCardRenderer({ props, renderNode }: ComponentRenderProps<ImageCardProps>) {
  const triggerAction = useTriggerAction();
  const formName = useFormName();
  const isStreaming = useIsStreaming();

  const items = (props.items ?? []) as ImageCardItemElement[];
  const isClickable = Boolean(props.action) && !isStreaming;

  const handleItemClick = (index: number) => {
    const item = items[index];
    if (!item || !props.action || isStreaming) return;
    const { id, title, overline, src, alt } = item.props;
    triggerAction(
      title || id || `Image card ${index + 1}`,
      formName,
      withItemContext(props.action, {
        itemIndex: index,
        itemId: id,
        itemTitle: title,
        itemOverline: overline,
        itemBgImageSrc: src,
        itemBgImageAlt: alt,
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
      className="openui-image-card-block"
      items={items.map((item) => {
        const { id, src, alt, actions } = item.props;
        return {
          id,
          title: insightOverline(item),
          content: insightContent(item, renderNode),
          topRight: actions ? renderOneOrMany(actions, renderNode) : undefined,
          bgImageSrc: src,
          bgImageAlt: alt,
        };
      })}
    />
  );
}

export const ImageCard = defineComponent({
  name: "ImageCard",
  props: ImageCardSchema,
  description:
    'A grid or carousel of 2 or more tall photo tiles for places, products, media or inspiration: ImageCard([item1, item2], layout?, responsive?, action?, gap?), e.g. ImageCard([lm1, lm2, lm3], "carousel", true, @ToAssistant("Tell me more about this Paris landmark")). Each tile is a real photo behind an overline (top left), optional IconButton actions (top right), and a title with a composable subtitle (bottom). Use it only when every item has a real image URL from a tool result or the user; with no real photos, use InsightCard. layout "grid" (default) for a main side-by-side set, "carousel" for secondary browsing. Keep every item the same shape. action is one shared action for every tile, with the clicked tile\'s details attached, so keep its @ToAssistant message generic and never use @OpenUrl there; IconButtons keep their own actions. For a single picture that illustrates an answer use Image, and for products with a price and a buy button use CompositeCardBlock.',
  component: ImageCardRenderer,
});

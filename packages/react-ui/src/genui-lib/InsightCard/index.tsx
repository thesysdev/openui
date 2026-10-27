"use client";

import type { SubComponentOf } from "@openuidev/react-lang";
import {
  ComponentRenderProps,
  defineComponent,
  useFormName,
  useIsStreaming,
  useTriggerAction,
} from "@openuidev/react-lang";
import type { ReactNode } from "react";
import { ContextCardBlock as OpenUIContextCardBlock } from "../../components/ContextCardBlock";
import { withItemContext } from "../cardActionUtils";
import { renderIconSlot } from "../iconSlot";
import { renderOneOrMany } from "../oneOrMany";
import { InsightCardSchema, type InsightCardItemProps, type InsightCardProps } from "./schema";

export * from "./schema";

type InsightCardItemElement = SubComponentOf<InsightCardItemProps>;

// Top: the overline with its optional inline leading.
export function insightOverline(item: {
  props: { overline?: string | null; leading?: unknown };
}): ReactNode {
  const { overline, leading } = item.props;
  if (!overline && !leading) return undefined;
  return (
    <div className="openui-context-card__overline">
      {leading ? (
        <span className="openui-context-card__overline-leading">{renderIconSlot(leading)}</span>
      ) : null}
      {overline ? <span>{overline}</span> : null}
    </div>
  );
}

// Bottom: the title and the composable subtitle under it.
export function insightContent(
  item: { props: { title?: string; subtitle?: unknown } },
  renderNode: (n: unknown) => ReactNode,
) {
  const { title, subtitle } = item.props;
  return (
    <div>
      {title ? <div className="openui-context-card__title">{title}</div> : null}
      {subtitle ? (
        <div className="openui-context-card__subtitle">{renderOneOrMany(subtitle, renderNode)}</div>
      ) : null}
    </div>
  );
}

function InsightCardRenderer({ props, renderNode }: ComponentRenderProps<InsightCardProps>) {
  const triggerAction = useTriggerAction();
  const formName = useFormName();
  const isStreaming = useIsStreaming();

  const items = (props.items ?? []) as InsightCardItemElement[];
  const isClickable = Boolean(props.action) && !isStreaming;

  const handleItemClick = (index: number) => {
    const item = items[index];
    if (!item || !props.action || isStreaming) return;
    const { id, title, overline, color } = item.props;
    triggerAction(
      title || id || `Insight ${index + 1}`,
      formName,
      withItemContext(props.action, {
        itemIndex: index,
        itemId: id,
        itemTitle: title,
        itemOverline: overline,
        itemBgColor: color,
      }),
    );
  };

  return (
    <OpenUIContextCardBlock
      className="openui-insight-card-block"
      layout={props.layout ?? "grid"}
      responsive={props.responsive !== false}
      gap={props.gap}
      clickable={isClickable}
      onItemClick={handleItemClick}
      items={items.map((item) => {
        const { id, color } = item.props;
        return {
          id,
          title: insightOverline(item),
          // Insight tiles are the overline and the title only; a subtitle the
          // model still passes is not drawn (ImageCard keeps it).
          content: insightContent({ props: { title: item.props.title } }, renderNode),
          bgColor: color,
        };
      })}
    />
  );
}

export const InsightCard = defineComponent({
  name: "InsightCard",
  props: InsightCardSchema,
  description:
    'A grid or carousel of 2 or more tall tiles, each one takeaway: InsightCard([item1, item2, item3], layout?, responsive?, action?, gap?). Each tile has a short overline (the topic) at the top and the insight as a large title at the bottom. Use it for key takeaways from research, trends or news topics to explore as entry points, plan options, or suggested next topics after an answer. layout "grid" (default) for the main side-by-side set, "carousel" for secondary browsing. Keep every item the same shape. Tiles have no photo; for photo tiles use ImageCard. action is one shared action for every tile, with the clicked tile\'s details attached and hover and press feedback added automatically, so keep its @ToAssistant message generic (e.g. "Tell me more about this trend") and never use @OpenUrl. For figures use ValueCard or ValueLayout; for products with a price and a button use CompositeCardBlock.',
  component: InsightCardRenderer,
});

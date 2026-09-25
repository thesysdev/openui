"use client";

import {
  ComponentRenderProps,
  defineComponent,
  useFormName,
  useIsStreaming,
  useTriggerAction,
} from "@openuidev/react-lang";
import { OverviewCardBlock as OpenUIOverviewCardBlock } from "../../components/OverviewCardBlock";
import { withItemContext } from "../cardActionUtils";
import {
  OverviewCardBlockSchema,
  type OverviewCardBlockProps,
  type OverviewCardItemNode,
} from "./schema";

export * from "./schema";

function getStringProp(node: unknown, key: string): string | undefined {
  const props =
    typeof node === "object" && node !== null && "props" in node
      ? (node as { props?: Record<string, unknown> }).props
      : undefined;
  const value = props?.[key];
  return typeof value === "string" ? value : undefined;
}

function getOverviewTitle(item: OverviewCardItemNode): string | undefined {
  return getStringProp(item.props.top, "title") ?? getStringProp(item.props.top, "value");
}

function OverviewCardBlockRenderer({
  props,
  renderNode,
}: ComponentRenderProps<OverviewCardBlockProps>) {
  const triggerAction = useTriggerAction();
  const formName = useFormName();
  const isStreaming = useIsStreaming();

  const items = (props.items ?? []) as OverviewCardItemNode[];
  const isClickable = Boolean(props.action) && !isStreaming;

  const handleItemClick = (item: OverviewCardItemNode, index: number) => {
    if (!props.action || isStreaming) return;
    const { id, top, bottom } = item.props;
    const title = getOverviewTitle(item);
    const label = title ?? id ?? `Overview card ${index + 1}`;
    triggerAction(
      label,
      formName,
      withItemContext(props.action, {
        itemIndex: index,
        itemId: id,
        itemTitle: title,
        itemSubtitle: getStringProp(top, "subtitle") ?? getStringProp(top, "subtext"),
        itemMetricValue: bottom?.props.value,
      }),
    );
  };

  return (
    <OpenUIOverviewCardBlock
      layout={props.layout ?? "grid"}
      responsive={props.responsive !== false}
      gap={props.gap}
      clickable={isClickable}
      onItemClick={
        isClickable
          ? (_item, index) => {
              const item = items[index];
              if (item) handleItemClick(item, index);
            }
          : undefined
      }
      items={items.map((item) => {
        const { id, top, bottom } = item.props;
        return {
          id,
          top: top ? renderNode(top) : undefined,
          bottom: bottom
            ? {
                value: bottom.props.value,
                subtext: bottom.props.subtext,
                trend: bottom.props.trend,
              }
            : undefined,
        };
      })}
    />
  );
}

export const OverviewCardBlock = defineComponent({
  name: "OverviewCardBlock",
  props: OverviewCardBlockSchema,
  description:
    "A grid or horizontal carousel of compact overview cards, each with a heading (icon/image/text) on top and an inline metric below; optionally clickable with a shared action.",
  component: OverviewCardBlockRenderer,
});

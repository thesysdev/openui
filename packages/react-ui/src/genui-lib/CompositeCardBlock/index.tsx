"use client";

import type { SubComponentOf } from "@openuidev/react-lang";
import {
  ComponentRenderProps,
  defineComponent,
  useFormName,
  useIsStreaming,
  useTriggerAction,
} from "@openuidev/react-lang";
import { Fragment, type ReactNode } from "react";
import { CompositeCardBlock as OpenUICompositeCardBlock } from "../../components/CompositeCardBlock";
import { BoldText } from "../BoldText";
import { Button } from "../Button";
import { withItemContext } from "../cardActionUtils";
import { AreaChartCondensed, BarChartCondensed, LineChartCondensed } from "../Charts";
import { EntityList } from "../EntityList";
import { ListBlock } from "../ListBlock";
import { MetricIndicatorInline, MetricIndicatorWithStrikethrough } from "../MetricIndicator";
import { TagBlock } from "../TagBlock";
import { Text } from "../Text";
import {
  CompositeCardBlockSchema,
  type CompositeCardBlockProps,
  type CompositeCardItemProps,
} from "./schema";

export * from "./schema";

type CompositeCardItemElement = SubComponentOf<CompositeCardItemProps>;
type ElementNode = SubComponentOf<Record<string, unknown>>;

const COMPOSITE_CARD_CHART_HEIGHT = 180;

function isElementOf(node: unknown, typeNames: string[]): node is ElementNode {
  return (
    typeof node === "object" &&
    node !== null &&
    (node as { type?: string }).type === "element" &&
    typeNames.includes((node as { typeName?: string }).typeName ?? "")
  );
}

function withProps(node: ElementNode, overrides: Record<string, unknown>): ElementNode {
  return { ...node, props: { ...node.props, ...overrides } };
}

/** Composite cards keep text size, metric size and chart height visually consistent. */
function renderCompositeCardNode(
  node: unknown,
  renderNode: (value: unknown) => ReactNode,
  key: string,
  location: "body" | "footer",
) {
  let value = node;

  if (location === "body" && isElementOf(node, [Text.name, BoldText.name])) {
    value = withProps(node, { size: "xs" });
  } else if (
    isElementOf(node, [AreaChartCondensed.name, BarChartCondensed.name, LineChartCondensed.name])
  ) {
    value = withProps(node, { height: COMPOSITE_CARD_CHART_HEIGHT });
  } else if (isElementOf(node, [ListBlock.name])) {
    value = withProps(node, { size: "small" });
  } else if (isElementOf(node, [EntityList.name])) {
    value = withProps(node, { size: "small", header: undefined, footer: undefined });
  } else if (isElementOf(node, [TagBlock.name])) {
    value = withProps(node, { size: "sm" });
  } else if (isElementOf(node, [Button.name])) {
    value = withProps(node, { size: "small" });
  } else if (
    location === "body" &&
    isElementOf(node, [MetricIndicatorInline.name, MetricIndicatorWithStrikethrough.name])
  ) {
    value = node;
  }

  return <Fragment key={key}>{renderNode(value)}</Fragment>;
}

function getCompositeHeaderText(item: CompositeCardItemElement) {
  const headerProps = item.props.header?.props as Record<string, unknown> | undefined;
  if (!headerProps) return {};

  const pick = (...keys: string[]) => {
    for (const key of keys) {
      const value = headerProps[key];
      if (typeof value === "string") return value;
    }
    return undefined;
  };

  return {
    title: pick("title", "value"),
    subtitle: pick("subtitle", "subtext"),
    imageAlt: pick("alt"),
  };
}

function CompositeCardBlockRenderer({
  props,
  renderNode,
}: ComponentRenderProps<CompositeCardBlockProps>) {
  const triggerAction = useTriggerAction();
  const formName = useFormName();
  const isStreaming = useIsStreaming();

  const items = (props.items ?? []) as CompositeCardItemElement[];
  const isClickable = Boolean(props.action) && !isStreaming;

  const handleItemClick = (index: number) => {
    const item = items[index];
    if (!item || !props.action || isStreaming) return;

    const { title, subtitle, imageAlt } = getCompositeHeaderText(item);
    const { id, body, footer } = item.props;
    const bodyItems = Array.isArray(body) ? body : [];
    const priceProps = footer?.price?.props as Record<string, unknown> | undefined;
    triggerAction(
      title || imageAlt || id || `Composite card ${index + 1}`,
      formName,
      withItemContext(props.action, {
        itemIndex: index,
        itemId: id,
        itemHeaderTitle: title,
        itemHeaderSubtitle: subtitle,
        itemHeaderAlt: imageAlt,
        itemBodyCount: bodyItems.length,
        itemFooterPrice: priceProps && "value" in priceProps ? priceProps["value"] : undefined,
        itemFooterButtonLabel: footer?.button?.props.label,
      }),
    );
  };

  return (
    <OpenUICompositeCardBlock
      layout={props.layout ?? "grid"}
      responsive={props.responsive !== false}
      gap={props.gap}
      clickable={isClickable}
      onItemClick={handleItemClick}
      items={items.map((item, index) => {
        const { id, header, body, footer } = item.props;
        const itemKey = id?.trim()
          ? `composite-card-${id.trim()}-${index}`
          : `composite-card-${index}`;
        const bodyItems = Array.isArray(body) ? body : [];

        return {
          id,
          header: header ? renderNode(header) : undefined,
          body: bodyItems.map((node, bodyIndex) =>
            renderCompositeCardNode(node, renderNode, `${itemKey}-body-${bodyIndex}`, "body"),
          ),
          footer: footer
            ? {
                price: footer.price
                  ? renderCompositeCardNode(
                      footer.price,
                      renderNode,
                      `${itemKey}-footer-price`,
                      "footer",
                    )
                  : undefined,
                button: footer.button
                  ? renderCompositeCardNode(
                      footer.button,
                      renderNode,
                      `${itemKey}-footer-button`,
                      "footer",
                    )
                  : undefined,
              }
            : undefined,
        };
      })}
    />
  );
}

export const CompositeCardBlock = defineComponent({
  name: "CompositeCardBlock",
  props: CompositeCardBlockSchema,
  description:
    "A two-per-row grid or carousel of rich cards, each with an optional header, stacked body content (text, metrics, charts, lists, tags) and a price/button footer; an optional action makes every card clickable.",
  component: CompositeCardBlockRenderer,
});

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
import { withItemContext } from "../cardActionUtils";
import { AreaChartCondensed, BarChartCondensed, LineChartCondensed } from "../Charts";
import { EntityList } from "../EntityList";
import { IconButton } from "../IconButton";
import { ListBlock } from "../ListBlock";
import { Metric } from "../Metric";
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
const COMPOSITE_CARD_MEDIA_CHART_HEIGHT = 140;
const CHART_NAMES = [AreaChartCondensed.name, BarChartCondensed.name, LineChartCondensed.name];

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
  location: "body" | "footer" | "price",
) {
  let value = node;

  if (location === "body" && isElementOf(node, [Text.name])) {
    // Headings keep their size; other Text reads as 14px body copy,
    // secondary unless emphasized (see the scss).
    const variant = node.props["variant"] as string | undefined;
    if (variant === "h1" || variant === "h2" || variant === "h3") {
      return <Fragment key={key}>{renderNode(node)}</Fragment>;
    }
    return (
      <div
        key={key}
        className={
          node.props["emphasis"]
            ? "openui-composite-card__text openui-composite-card__text--emphasis"
            : "openui-composite-card__text"
        }
      >
        {renderNode(withProps(node, { variant: "default" }))}
      </div>
    );
  } else if (
    isElementOf(node, [AreaChartCondensed.name, BarChartCondensed.name, LineChartCondensed.name])
  ) {
    value = withProps(node, { height: COMPOSITE_CARD_CHART_HEIGHT });
  } else if (location === "price" && isElementOf(node, [Metric.name])) {
    // The footer price is the card's headline figure: 18px.
    value = withProps(node, { size: "large" });
  } else if (isElementOf(node, [ListBlock.name])) {
    value = withProps(node, { size: "small" });
  } else if (isElementOf(node, [EntityList.name])) {
    value = withProps(node, { size: "small", header: undefined, footer: undefined });
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

    const header = getCompositeHeaderText(item);
    const { title, subtitle } = header;
    const imageAlt =
      header.imageAlt ?? (item.props["media"]?.props as { alt?: string } | undefined)?.alt;
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
        itemFooterButtonLabel: Array.isArray(footer?.button)
          ? undefined
          : (footer?.button?.props as { label?: string } | undefined)?.label,
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
        const { id, header, body, footer, media } = item.props;
        const itemKey = id?.trim()
          ? `composite-card-${id.trim()}-${index}`
          : `composite-card-${index}`;
        const bodyItems = Array.isArray(body) ? body : [];

        return {
          id,
          media: media
            ? renderNode(
                isElementOf(media, CHART_NAMES)
                  ? withProps(media, { height: COMPOSITE_CARD_MEDIA_CHART_HEIGHT })
                  : media,
              )
            : undefined,
          mediaKind: media ? (isElementOf(media, CHART_NAMES) ? "chart" : "image") : undefined,
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
                      "price",
                    )
                  : undefined,
                button: footer.button
                  ? Array.isArray(footer.button)
                    ? footer.button.map((node, i) =>
                        renderCompositeCardNode(
                          node,
                          renderNode,
                          `${itemKey}-footer-button-${i}`,
                          "footer",
                        ),
                      )
                    : renderCompositeCardNode(
                        footer.button,
                        renderNode,
                        `${itemKey}-footer-button`,
                        "footer",
                      )
                  : undefined,
                iconActions:
                  Array.isArray(footer.button) || isElementOf(footer.button, [IconButton.name]),
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
    'The fallback card block: use it only when no specialised card fits, so first reach for ImageCard (photo tiles), InsightCard (takeaways), ValueCard or ValueLayout (figures), EntityList or ListBlock (rows), or OptionCards (choices in a form). A two-per-row grid or carousel of 2 or more rich cards, for products, offers, plans or deep-dive topics that need more than a title and a line, such as a header, mixed body content and a price or button footer: CompositeCardBlock([item1, item2], layout?, responsive?, action?, gap?). layout "grid" (default) for side-by-side comparison, "carousel" for secondary browsing. Every card uses the same parts in the same order. action is one shared action for every card, with the clicked card\'s details attached, so keep its @ToAssistant message generic and never use @OpenUrl there; give each card its own link with a footer Button instead. For short facts use ValueCard or ValueLayout; for photo tiles use ImageCard.',
  component: CompositeCardBlockRenderer,
});

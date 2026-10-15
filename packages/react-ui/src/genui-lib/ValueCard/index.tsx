"use client";

import {
  ComponentRenderProps,
  defineComponent,
  useFormName,
  useIsStreaming,
  useTriggerAction,
} from "@openuidev/react-lang";
import clsx from "clsx";
import type { ReactNode } from "react";
import { OverviewCardBlock as OpenUIOverviewCardBlock } from "../../components/OverviewCardBlock";
import { ValueCardBlock as OpenUIValueCardBlock } from "../../components/ValueCardBlock";
import { withItemContext } from "../cardActionUtils";
import { renderIconSlot } from "../iconSlot";
import { renderOneOrMany } from "../oneOrMany";
import { ValueCardSchema, type ValueCardItemNode, type ValueCardProps } from "./schema";

export * from "./schema";

type Node = { typeName?: string; props?: Record<string, unknown> };

function getStringProp(node: unknown, key: string): string | undefined {
  const value = (node as Node | undefined)?.props?.[key];
  return typeof value === "string" ? value : undefined;
}

// A Metric keeps the size it was given; otherwise horizontal cards use sm and
// the vertical card's KPI is the hero at the default size. Text values keep
// the compact override.
function sizedValue(value: unknown, metricSize: "sm" | "default"): unknown {
  if (Array.isArray(value)) return value.map((v) => sizedValue(v, metricSize));
  const node = value as Node | undefined;
  if (!node || typeof node !== "object") return node;
  if (node.typeName === "Metric") {
    return { ...node, props: { ...node.props, size: node.props?.["size"] ?? metricSize } };
  }
  return metricSize === "sm" ? { ...node, props: { ...node.props, size: "xs" } } : node;
}

type RenderNode = (node: unknown) => ReactNode;

// The leading, title and subtitle on one line, the way a LeadingText reads.
// A horizontal card with a subtitle stacks the title over the subtitle
// instead, with a larger leading sized to the two lines (a bare Icon becomes
// a neutral badge there).
function cardLabel(item: ValueCardItemNode, renderNode: RenderNode, stacked: boolean): ReactNode {
  const { title, subtitle, leading } = item.props;
  const lead = leading as Node | undefined;
  const leadNode =
    stacked && lead?.typeName === "Icon" && lead.props?.["name"]
      ? { typeName: "Avatar", props: { name: lead.props["name"], icon: lead } }
      : lead;
  return (
    <span
      className={clsx("openui-value-card-label", stacked && "openui-value-card-label--stacked")}
    >
      {leadNode ? (
        <span className="openui-value-card-label__leading">{renderIconSlot(leadNode)}</span>
      ) : null}
      <span className="openui-value-card-label__text">
        <span className="openui-value-card-label__title">{title}</span>
        {subtitle ? (
          <span className="openui-value-card-label__subtitle">
            {renderOneOrMany(subtitle, renderNode)}
          </span>
        ) : null}
      </span>
    </span>
  );
}

export function ValueCardRenderer({ props, renderNode }: ComponentRenderProps<ValueCardProps>) {
  const triggerAction = useTriggerAction();
  const formName = useFormName();
  const isStreaming = useIsStreaming();

  const items = (props.items ?? []) as ValueCardItemNode[];
  const vertical = props.layout === "vertical";
  const isClickable = Boolean(props.action) && !isStreaming;

  const handleItemClick = (index: number) => {
    const item = items[index];
    if (!item || !props.action || isStreaming) return;
    const { id, title, subtitle, value } = item.props;
    triggerAction(
      title ?? id ?? `Value card ${index + 1}`,
      formName,
      withItemContext(props.action, {
        itemIndex: index,
        itemId: id,
        itemTitle: title,
        itemSubtitle: typeof subtitle === "string" ? subtitle : undefined,
        itemValue: getStringProp(value, "value") ?? getStringProp(value, "text"),
        itemMetricDelta: getStringProp(value, "delta"),
      }),
    );
  };
  const onItemClick = isClickable
    ? (_item: unknown, index: number) => handleItemClick(index)
    : undefined;

  if (vertical) {
    return (
      <OpenUIOverviewCardBlock
        layout={props.carousel ? "carousel" : "grid"}
        responsive={props.responsive !== false}
        gap={props.gap}
        clickable={isClickable}
        onItemClick={onItemClick}
        items={items.map((item) => ({
          id: item.props.id,
          top: cardLabel(item, renderNode, false),
          bottomContent: renderOneOrMany(sizedValue(item.props.value, "default"), renderNode),
        }))}
      />
    );
  }

  return (
    <OpenUIValueCardBlock
      responsive={props.responsive !== false}
      gap={props.gap}
      clickable={isClickable}
      onItemClick={onItemClick}
      items={items.map((item) => {
        const { id, title, subtitle, value } = item.props;
        return {
          id,
          lhs: cardLabel(item, renderNode, Boolean(item.props.subtitle)),
          rhs: renderOneOrMany(sizedValue(value, "sm"), renderNode),
          lhsTooltip: {
            heading: title,
            content: typeof subtitle === "string" ? subtitle : undefined,
          },
          rhsTooltip: {
            heading: getStringProp(value, "value"),
            content: getStringProp(value, "delta"),
          },
        };
      })}
    />
  );
}

export const ValueCard = defineComponent({
  name: "ValueCard",
  props: ValueCardSchema,
  description:
    'A responsive grid of 2 or more compact cards, each one short fact or KPI: ValueCard([item1, item2, item3], layout?, responsive?, action?, gap?, carousel?). Each card is a ValueCardItem(id?, title, subtitle?, leading?, value?), e.g. ValueCardItem("revenue", "Revenue", "Month to date", Icon("circle-dollar-sign", "finance"), Metric("$48,200", "+8.1%", null, "sm")). Set layout once on the ValueCard for the whole group, never per item. Use "horizontal" only when every value is a single short piece (one Metric or a short Text); if any value has more, such as a Metric plus a Tag or a Metric plus a Text note, use "vertical" for the whole block. "horizontal" (default) is for key/value facts: the value goes on the right, with a Metric at "sm"; with a subtitle the title stacks over it beside a 36px leading (an Avatar fills it, a bare Icon becomes a neutral badge), and without one the leading sits inline before the title like a LeadingText. "vertical" is for KPI tiles where the number is the hero: the leading and title sit on one line, the subtitle on its own line under the title, and the value goes below at the default size, e.g. ValueCard([v1, v2, v3], "vertical", true). leading is an Icon for a concept, or an Avatar for a person or company with a real photo or logo. carousel (vertical only) scrolls the cards sideways instead of wrapping, for secondary browsing. Every item uses the same parts. action is one shared action for all cards, with the clicked card\'s details attached, so keep its @ToAssistant message generic and never use @OpenUrl. Use ValueCard for dashboard-like output, such as an analytics or monitoring view; for an inline section of figures inside a normal response use ValueLayout instead. For a long list of key/value rows use EntityList; for one headline figure use a Metric on its own.',
  component: ValueCardRenderer,
});

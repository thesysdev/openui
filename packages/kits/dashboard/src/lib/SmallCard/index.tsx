"use client";

import { IconTag } from "@openuidev/react-components";
import { defineComponent, type ComponentRenderProps } from "@openuidev/react-lang";
import { type ComponentProps } from "react";
import { SmallCardMetric, SmallCardSlots, SmallCardSnippet } from "../../components/SmallCard";
import { toIconProps } from "../iconProps";
import { smallCardPropsSchema, type SmallCardProps } from "./schema";

type SnippetLhs = {
  title: string;
  subtitle?: string;
  icon?: unknown;
  iconVariant?: string;
  imageSrc?: string;
  imageAlt?: string;
};

type SnippetRhs = {
  value: string;
  subtext?: string;
  variant?: string;
  subtextVariant?: string;
};

function isSnippetLhs(value: unknown): value is SnippetLhs {
  return (
    typeof value === "object" &&
    value !== null &&
    "title" in value &&
    typeof (value as SnippetLhs).title === "string"
  );
}

function isSnippetRhs(value: unknown): value is SnippetRhs {
  return (
    typeof value === "object" &&
    value !== null &&
    "value" in value &&
    typeof (value as SnippetRhs).value === "string"
  );
}

function SmallCardRenderer({ props, renderNode }: ComponentRenderProps<SmallCardProps>) {
  if (typeof props.top === "string" && typeof props.bottom === "string") {
    return (
      <SmallCardMetric
        title={props.top}
        metric={props.bottom}
        trend={typeof props.trend === "object" && props.trend !== null ? props.trend : undefined}
      />
    );
  }

  if (isSnippetLhs(props.top) && isSnippetRhs(props.bottom)) {
    const { icon, iconVariant, ...lhs } = props.top;
    return (
      <SmallCardSnippet
        lhs={{
          ...lhs,
          icon: toIconProps(icon) ?? undefined,
          iconVariant: iconVariant as ComponentProps<typeof IconTag>["variant"],
        }}
        rhs={{
          ...props.bottom,
          variant: props.bottom.variant as "text" | "number" | "textOnly" | undefined,
        }}
      />
    );
  }

  return <SmallCardSlots top={renderNode(props.top)} bottom={renderNode(props.bottom ?? [])} />;
}

export const SmallCardComponent = defineComponent({
  name: "SmallCard",
  props: smallCardPropsSchema,
  description:
    "Compact dashboard card with three named forms. Overview card with icon: SmallCard(IconText(Icon(...), iconVariant), [MetricIndicator(value, label, trend?)]) for a metric that has a clear universal symbol. Overview card: SmallCard(title, metric, trend?) for abstract, composite, or system-specific metrics without a universal icon. Snippet card: SmallCard(lhs, rhs) for compact entity, task, account, or status rows; lhs is a non-emphasized object with title plus icon or imageSrc, and rhs is a required object with an emphasized value.",
  component: SmallCardRenderer,
});

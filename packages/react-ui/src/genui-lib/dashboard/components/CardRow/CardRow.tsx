"use client";

import { defineComponent, type ComponentRenderProps } from "@openuidev/react-lang";
import clsx from "clsx";
import { DASHBOARD_CLASS_PREFIX } from "../../classPrefix";
import { PieChartComponent } from "../DashboardCharts/PieChart/PieChart";
import { LargeCardComponent } from "../LargeCard/LargeCard";
import { cardRowPropsSchema, type CardRowProps } from "./schema";

type CardKind = "small" | "medium" | "large";
type CardRowVariant = "empty" | "small" | "medium" | "medium-large" | "large";
type ElementNode = {
  type?: string;
  typeName?: string;
  props?: Record<string, unknown>;
};

function getCardKind(child: unknown): CardKind | null {
  if (!isElementNode(child)) return null;
  if (child.typeName === "SmallCard") return "small";
  if (child.typeName === "MediumCard") return "medium";
  if (child.typeName === "LargeCard") return "large";
  return null;
}

function getCardRowVariant(children: unknown[]): CardRowVariant | null {
  if (children.length === 0) return "empty";

  const kinds = new Set<CardKind>();
  for (const child of children) {
    const kind = getCardKind(child);
    if (!kind) return null;
    kinds.add(kind);
  }

  if (kinds.size === 1) {
    if (kinds.has("small")) return "small";
    if (kinds.has("medium")) return "medium";
    if (kinds.has("large")) return "large";
  }

  if (kinds.size === 2 && kinds.has("medium") && kinds.has("large")) {
    return "medium-large";
  }

  return null;
}

function isElementNode(value: unknown): value is ElementNode {
  return typeof value === "object" && value !== null && (value as ElementNode).type === "element";
}

function normalizeCollapsedLargeCards(
  children: CardRowProps["children"],
  variant: CardRowVariant | null,
) {
  if (variant !== "large") return children;

  return (children as unknown[]).map((child) => {
    if (
      !isElementNode(child) ||
      child.typeName !== LargeCardComponent.name ||
      child.props?.["collapsed"] !== true
    ) {
      return child;
    }

    return {
      ...child,
      props: { ...child.props, collapsed: false },
    };
  }) as CardRowProps["children"];
}

function normalizeThreeMediumCardRow(children: CardRowProps["children"]) {
  const rowChildren = children as unknown[];

  if (rowChildren.length !== 3 || rowChildren.some((child) => getCardKind(child) !== "medium")) {
    return children;
  }

  return rowChildren.map((child) => {
    if (!isElementNode(child)) return child;

    const cardChildren = child.props?.["children"];
    if (!Array.isArray(cardChildren)) return child;

    return {
      ...child,
      props: {
        ...child.props,
        children: cardChildren.map((cardChild) => {
          if (!isElementNode(cardChild) || cardChild.typeName !== PieChartComponent.name) {
            return cardChild;
          }

          return {
            ...cardChild,
            props: { ...cardChild.props, appearance: "semiCircular" },
          };
        }),
      },
    };
  });
}

function CardRowRenderer({ props, renderNode }: ComponentRenderProps<CardRowProps>) {
  const variant = getCardRowVariant(props.children);
  const collapseNormalizedChildren = normalizeCollapsedLargeCards(props.children, variant);
  const children = normalizeThreeMediumCardRow(collapseNormalizedChildren);

  return (
    <div
      className={clsx(
        `${DASHBOARD_CLASS_PREFIX}-card-row`,
        `${DASHBOARD_CLASS_PREFIX}-card-row--align-${props.align ?? "stretch"}`,
        variant && variant !== "empty" && `${DASHBOARD_CLASS_PREFIX}-card-row--type-${variant}`,
        `${DASHBOARD_CLASS_PREFIX}-card-row--count-${props.children.length}`,
      )}
    >
      {renderNode(children)}
    </div>
  );
}

export const CardRowComponent = defineComponent({
  name: "CardRow",
  props: cardRowPropsSchema,
  description: "",
  component: CardRowRenderer,
});

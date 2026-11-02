"use client";

import { type ComponentRenderProps, useIsStreaming } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { ShellCard, type ShellCardSize } from "../components/ShellCard";
import { ButtonComponent } from "./Button";
import { ButtonGroupComponent } from "./ButtonGroup";
import { CalloutComponent } from "./Callout";
import { AreaChartComponent } from "./Charts/AreaChart";
import { BarChartComponent } from "./Charts/BarChart";
import { HorizontalBarChartComponent } from "./Charts/HorizontalBarChart";
import { LineChartComponent } from "./Charts/LineChart";
import { PieChartComponent } from "./Charts/PieChart";
import { RadarChartComponent } from "./Charts/RadarChart";
import { RadialChartComponent } from "./Charts/RadialChart";
import { ScatterChartComponent } from "./Charts/ScatterChart";
import { DashboardCardHeaderComponent } from "./DashboardCardHeader";
import { EntityListComponent } from "./EntityList";
import { ImageBlockComponent } from "./ImageBlock";
import { ListComponent } from "./List";
import { MarkDownRendererComponent } from "./MarkDownRenderer";
import { MetricIndicatorComponent } from "./MetricIndicator";
import { TableComponent } from "./Table";
import { TagBlockComponent } from "./TagBlock";
import { TextCalloutComponent } from "./TextCallout";
import { TextContentComponent } from "./TextContent";
export const mediumCardChildSchema = z.union([
  DashboardCardHeaderComponent.ref,
  BarChartComponent.ref,
  LineChartComponent.ref,
  AreaChartComponent.ref,
  RadarChartComponent.ref,
  HorizontalBarChartComponent.ref,
  PieChartComponent.ref,
  RadialChartComponent.ref,
  ScatterChartComponent.ref,
  TableComponent.ref,
  MetricIndicatorComponent.ref,
  TextContentComponent.ref,
  MarkDownRendererComponent.ref,
  CalloutComponent.ref,
  TextCalloutComponent.ref,
  ImageBlockComponent.ref,
  TagBlockComponent.ref,
  ButtonComponent.ref,
  ButtonGroupComponent.ref,
  ListComponent.ref,
  EntityListComponent.ref,
]);

export const largeCardChildSchema = z.union([
  DashboardCardHeaderComponent.ref,
  BarChartComponent.ref,
  LineChartComponent.ref,
  AreaChartComponent.ref,
  HorizontalBarChartComponent.ref,
  ScatterChartComponent.ref,
  TableComponent.ref,
  MetricIndicatorComponent.ref,
  TextContentComponent.ref,
  MarkDownRendererComponent.ref,
  CalloutComponent.ref,
  TextCalloutComponent.ref,
  ImageBlockComponent.ref,
  TagBlockComponent.ref,
  ButtonComponent.ref,
  ButtonGroupComponent.ref,
  ListComponent.ref,
  EntityListComponent.ref,
]);

export const createCardPropsSchema = (childSchema: z.ZodTypeAny) =>
  z.object({
    children: z.array(childSchema).default([]),
    collapsed: z.boolean().default(false),
  });

type AppCardProps = {
  children: unknown[];
  collapsed: boolean;
};

function normalizeMediumCardChildren(children: unknown[], size: ShellCardSize) {
  if (size !== "medium") {
    return children;
  }

  return children.map((child) => {
    if (
      typeof child !== "object" ||
      child === null ||
      (child as { type?: string }).type !== "element" ||
      (child as { typeName?: string }).typeName !== PieChartComponent.name
    ) {
      return child;
    }

    return {
      ...child,
      props: {
        ...(child as { props?: Record<string, unknown> }).props,
        legendVariant: "stacked",
      },
    };
  });
}

function getCardTitle(children: unknown[]) {
  const header = children.find(
    (child) =>
      typeof child === "object" &&
      child !== null &&
      (child as { typeName?: string }).typeName === DashboardCardHeaderComponent.name,
  ) as { props?: { title?: unknown } } | undefined;

  return typeof header?.props?.title === "string" ? header.props.title : "Card details";
}

export function AppCardRenderer({
  props,
  renderNode,
  size,
}: ComponentRenderProps<AppCardProps> & {
  size: ShellCardSize;
}) {
  const isStreaming = useIsStreaming();

  return (
    <ShellCard
      size={size}
      collapsed={size !== "small" && props.collapsed === true}
      streaming={isStreaming}
      modalTitle={getCardTitle(props.children)}
    >
      {renderNode(normalizeMediumCardChildren(props.children, size))}
    </ShellCard>
  );
}

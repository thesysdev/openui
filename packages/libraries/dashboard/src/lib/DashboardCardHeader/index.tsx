"use client";

import { defineComponent, type ComponentRenderProps } from "@openuidev/react-lang";
import { Fragment, type ReactElement } from "react";
import { DashboardCardHeader } from "../../components/DashboardCardHeader";
import { formatMetric } from "../../shared/format";
import { dashboardCardHeaderPropsSchema, type DashboardCardHeaderProps } from "./schema";

// A "number" title may arrive as a number (a query's count); the header takes text, and a
// large number reads better shortened.
function formatTitle({ title, titleType }: DashboardCardHeaderProps): string {
  const text = title == null ? "" : String(title);
  return titleType === "number" ? formatMetric(text) : text;
}

function DashboardCardHeaderRenderer({
  props,
  renderNode,
}: ComponentRenderProps<DashboardCardHeaderProps>) {
  return (
    <DashboardCardHeader
      title={formatTitle(props)}
      subtitle={props.subtitle}
      titleType={props.titleType}
      controls={props.controls?.map((control, index) => (
        <Fragment key={`control-${index}`}>{renderNode(control) as ReactElement}</Fragment>
      ))}
    />
  );
}

export const DashboardCardHeaderComponent = defineComponent({
  name: "DashboardCardHeader",
  props: dashboardCardHeaderPropsSchema,
  description:
    'Card header for MediumCard and LargeCard. If the card has a clear leading KPI or score, prefer making that value the title with titleType "number" and use the subtitle for the label; use titleType "text" for descriptive titles.',
  component: DashboardCardHeaderRenderer,
});

"use client";

import { defineComponent, type ComponentRenderProps } from "@openuidev/react-lang";
import { Fragment, type ReactElement } from "react";
import { DashboardCardHeader } from "../../components/DashboardCardHeader";
import { dashboardCardHeaderPropsSchema, type DashboardCardHeaderProps } from "./schema";

function DashboardCardHeaderRenderer({
  props,
  renderNode,
}: ComponentRenderProps<DashboardCardHeaderProps>) {
  return (
    <DashboardCardHeader
      title={props.title}
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

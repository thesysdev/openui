"use client";

import { defineComponent, type ComponentRenderProps } from "@openuidev/react-lang";
import { Fragment, type ReactElement } from "react";
import { DashboardHeader } from "../../components/DashboardHeader";
import { dashboardHeaderPropsSchema, type DashboardHeaderProps } from "./schema";

function DashboardHeaderRenderer({
  props,
  renderNode,
}: ComponentRenderProps<DashboardHeaderProps>) {
  return (
    <DashboardHeader
      title={props.title}
      subtitle={props.subtitle}
      controls={props.controls?.map((control, index) => (
        <Fragment key={`control-${index}`}>{renderNode(control) as ReactElement}</Fragment>
      ))}
    />
  );
}

export const DashboardHeaderComponent = defineComponent({
  name: "DashboardHeader",
  props: dashboardHeaderPropsSchema,
  description: "",
  component: DashboardHeaderRenderer,
});

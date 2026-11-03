"use client";

import { defineComponent, type ComponentRenderProps } from "@openuidev/react-lang";
import { Dashboard } from "../../components/Dashboard";
import { dashboardPropsSchema, type DashboardProps } from "./schema";

function DashboardRenderer({ props, renderNode }: ComponentRenderProps<DashboardProps>) {
  return <Dashboard>{renderNode(props.children)}</Dashboard>;
}

export const DashboardComponent = defineComponent({
  name: "Dashboard",
  props: dashboardPropsSchema,
  description:
    "Root component for dashboard apps. Use as Dashboard([DashboardHeader(...), Section(...), ...]).",
  component: DashboardRenderer,
});

"use client";

import { defineComponent, type ComponentRenderProps } from "@openuidev/react-lang";
import { DASHBOARD_CLASS_PREFIX } from "../../classPrefix";
import { DashboardThemeProvider } from "../../theme";
import { dashboardPropsSchema, type DashboardProps } from "./schema";

function DashboardRenderer({ props, renderNode }: ComponentRenderProps<DashboardProps>) {
  return (
    <DashboardThemeProvider>
      <div className={`${DASHBOARD_CLASS_PREFIX}`}>{renderNode(props.children)}</div>
    </DashboardThemeProvider>
  );
}

export const DashboardComponent = defineComponent({
  name: "Dashboard",
  props: dashboardPropsSchema,
  description:
    "Root component for dashboard apps. Use as Dashboard([DashboardHeader(...), Section(...), ...]).",
  component: DashboardRenderer,
});

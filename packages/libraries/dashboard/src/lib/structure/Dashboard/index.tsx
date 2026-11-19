"use client";

import {
  defineComponent,
  useIsStreaming,
  useRendererQuery,
  type ComponentRenderProps,
} from "@openuidev/react-lang";
import { useRef } from "react";
import { Dashboard, type DashboardProps } from "../../../components/structure/Dashboard";
import type { Covered, SchemaCoverage } from "../../schemaCoverage";
import { styleClasses } from "../../styles";
import { dashboardPropsSchema, type DashboardSchemaProps } from "./schema";

export const DashboardComponent = defineComponent({
  name: "Dashboard",
  props: dashboardPropsSchema,
  description: "The root.",
  component: DashboardView,
});

function DashboardView({ props, renderNode }: ComponentRenderProps<DashboardSchemaProps>) {
  const streaming = useIsStreaming();
  const query = useRendererQuery();
  const children = Array.isArray(props.children) ? props.children : [];
  // Live data refetching (a filter changed): every card keeps its numbers and shows the refresh loader.
  // Only after a fetch has started and finished once: the first fetch is loading, not
  // refreshing. (Before its queries start, the renderer briefly reports not loading.)
  const fetched = useRef<"none" | "first" | "done">("none");
  if (query.isLoading && fetched.current === "none") fetched.current = "first";
  else if (!query.isLoading && fetched.current === "first") fetched.current = "done";
  const refreshing =
    query.isLoading && !streaming && fetched.current === "done" && children.length > 0;
  return (
    <Dashboard
      styleClasses={styleClasses}
      refreshing={refreshing}
      hasErrors={Boolean(query.errors.length && !streaming)}
      empty={!streaming && !children.length}
    >
      {!streaming && !children.length ? null : renderNode(props.children)}
    </Dashboard>
  );
}

// Every schema field reaches Dashboard.
export type DashboardSchemaCovered = Covered<SchemaCoverage<DashboardSchemaProps, DashboardProps>>;

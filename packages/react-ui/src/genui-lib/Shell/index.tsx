"use client";

import { ComponentRenderProps, defineComponent } from "@openuidev/react-lang";
import { Shell as OpenUIShell } from "../../components/Shell";
import { ShellSchema, type ShellProps } from "./schema";

export * from "./schema";

// Children are loose so the chat Shell, with its own children union, can share this renderer.
type ShellRenderProps = ComponentRenderProps<
  Omit<ShellProps, "children"> & { children: unknown[] }
>;

/** Shared renderer — also used by the chat library's Shell variant (typed children). */
export function ShellRenderer({ props, renderNode }: ShellRenderProps) {
  return <OpenUIShell title={props.title ?? ""}>{renderNode(props.children)}</OpenUIShell>;
}

export const SHELL_DESCRIPTION = `A frame for a dashboard or a large Grid composition: Shell(title, children). It shows a small title over its content, renders wider than the chat column, and has an expand button that opens the content full screen. title is a short name for what it shows (e.g. "Store performance, last 30 days"). Children stack top to bottom, usually one or two Grids of Cards. Use at most one Shell per response, only for dashboards and large Grid layouts; ordinary answers never need one.`;

export const Shell = defineComponent({
  name: "Shell",
  props: ShellSchema,
  description: SHELL_DESCRIPTION,
  component: ShellRenderer,
});

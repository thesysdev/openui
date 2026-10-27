"use client";

import {
  ComponentRenderProps,
  OpenUIContext,
  defineComponent,
  useOpenUI,
  type OpenUIContextValue,
} from "@openuidev/react-lang";
import { useMemo, type ReactNode } from "react";
import { Shell as OpenUIShell } from "../../components/Shell";
import { ShellSchema, type ShellProps } from "./schema";

export * from "./schema";

// Children are loose so the chat Shell, with its own children union, can share this renderer.
type ShellRenderProps = ComponentRenderProps<
  Omit<ShellProps, "children"> & { children: unknown[] }
>;

// Steps that only change state on the page (Set, Reset, Run) keep the full-screen
// view open, so filters and toggles work in it; anything that leaves the
// dashboard (a message, a link, a host action) closes it first.
const STAYS_OPEN = new Set(["set", "reset", "run"]);

function leavesDashboard(action: Parameters<OpenUIContextValue["triggerAction"]>[2]): boolean {
  if (!action) return true;
  if ("steps" in action) return action.steps.some((step) => !STAYS_OPEN.has(step.type));
  return true;
}

function CloseOnAction({ close, children }: { close: () => void; children: ReactNode }) {
  const ctx = useOpenUI();
  const value = useMemo<OpenUIContextValue>(
    () => ({
      ...ctx,
      triggerAction: (userMessage, formName, action) => {
        if (leavesDashboard(action)) close();
        return ctx.triggerAction(userMessage, formName, action);
      },
    }),
    [ctx, close],
  );
  return <OpenUIContext.Provider value={value}>{children}</OpenUIContext.Provider>;
}

/** Shared renderer — also used by the chat library's Shell variant (typed children). */
export function ShellRenderer({ props, renderNode }: ShellRenderProps) {
  return (
    <OpenUIShell title={props.title ?? ""}>
      {({ close }) =>
        close ? (
          <CloseOnAction close={close}>{renderNode(props.children)}</CloseOnAction>
        ) : (
          renderNode(props.children)
        )
      }
    </OpenUIShell>
  );
}

export const SHELL_DESCRIPTION = `A frame for a dashboard or a large Grid composition: Shell(title, children). It shows a small title over its content, renders wider than the chat column, and has an expand button that opens the content full screen. title is a short name for what it shows (e.g. "Store performance, last 30 days"). Children stack top to bottom, usually one or two Grids of Cards. Every titled group is its own Section inside the Shell, Section([Heading("Top 5 customers"), Table(...)]); never put a Heading directly in the Shell or inside a Grid. Use at most one Shell per response, only for dashboards and large Grid layouts; ordinary answers never need one. Keep anything that leaves the dashboard outside the Shell: follow-ups, FollowUpBlock, and Buttons that ask the assistant something or open a link go after it, never inside. Inside it, only controls that change the dashboard itself, such as filters.`;

export const Shell = defineComponent({
  name: "Shell",
  props: ShellSchema,
  description: SHELL_DESCRIPTION,
  component: ShellRenderer,
});

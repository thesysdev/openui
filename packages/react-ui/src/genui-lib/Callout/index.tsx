"use client";

import { defineComponent, useStateField } from "@openuidev/react-lang";
import React from "react";
import { IconWrapper } from "../../components/_shared/icons";
import { Callout as OpenUICallout } from "../../components/Callout";
import { MarkDownRenderer } from "../../components/MarkDownRenderer";
import { renderIconSlot } from "../iconSlot";
import { CalloutSchema } from "./schema";

type CalloutVariant = NonNullable<React.ComponentProps<typeof OpenUICallout>["variant"]>;

// Icon shown when the agent doesn't pass one.
const DEFAULT_ICONS: Record<string, string> = {
  info: "info",
  success: "circle-check",
  warning: "triangle-alert",
  danger: "circle-x",
  error: "circle-x",
  purple: "sparkles",
  pink: "heart",
  inverted: "info",
  neutral: "lightbulb",
};

export { CalloutSchema } from "./schema";

export const Callout = defineComponent({
  name: "Callout",
  props: CalloutSchema,
  description:
    'A Notion-style callout: an icon followed by Markdown content on a tinted block, with no title. Use it to make one important aside stand out from the answer around it: a tip, a caveat, a warning or the result of an action. Keep it to 1–3 sentences and lead with a short bold phrase when that helps, e.g. Callout("warning", "**Visa required.** Apply at least 3 weeks before you travel."). Use at most one or two per response; regular explanation belongs in Markdown. Pick variant by meaning, which also sets the tint and default icon: "info" context (info), "success" a positive result (circle-check), "warning" a caution (triangle-alert), "danger" a failure or risk (circle-x; "error" is an alias), "neutral" a tip (lightbulb), "purple" a highlight or something new (sparkles), "pink" something personal or loved (heart), "inverted" a high-emphasis note on a dark block (info). Most callouts are info, success, warning, danger or neutral; use purple, pink and inverted sparingly. Pass an Icon only when a more specific one helps, e.g. Callout("info", "Doors open at 7pm.", null, Icon("clock")). visible is an optional reactive $boolean for a toast: it auto-dismisses after 3s by setting $visible to false.',
  component: ({ props }) => {
    const field = useStateField("visible", props.visible);

    const hasVisibleBinding = field.isReactive;
    const isVisible = hasVisibleBinding
      ? field.value === true || (field.value as any) === "true"
      : true;

    // Auto-dismiss: set $visible = false after 3s
    React.useEffect(() => {
      if (!hasVisibleBinding || !isVisible) return;
      const timer = setTimeout(() => {
        field.setValue(false);
      }, 3000);
      return () => clearTimeout(timer);
    }, [hasVisibleBinding, isVisible, field]);

    if (!isVisible) return null;

    const variantMap: Record<string, CalloutVariant> = {
      neutral: "neutral",
      info: "info",
      success: "success",
      warning: "warning",
      danger: "danger",
      error: "danger",
      purple: "purple",
      pink: "pink",
      inverted: "inverted",
    };
    const variant = (props.variant as string) || "info";
    const icon = renderIconSlot(props.icon) ?? (
      <IconWrapper name={DEFAULT_ICONS[variant] ?? "info"} />
    );
    return (
      <OpenUICallout
        variant={variantMap[variant] || "info"}
        icon={icon}
        description={<MarkDownRenderer textMarkdown={(props.content as string) ?? ""} />}
        duration={hasVisibleBinding ? 3000 : undefined}
      />
    );
  },
});

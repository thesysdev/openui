"use client";

import { defineComponent } from "@openuidev/react-lang";
import React from "react";
import { FaviconLink } from "../../components/Link";
import { LinkSchema } from "./schema";

export { LinkSchema } from "./schema";

// default matches Text "default": 14px on a 20px line, in the Markdown link
// style. lg matches a title (16px Medium on a 24px line); the favicon is 1em,
// so it scales with it.
const STYLES = {
  default: {
    font: "var(--openui-font-weight-medium) var(--openui-font-size-sm)/20px var(--openui-font-body)",
  },
  lg: {
    font: "var(--openui-font-weight-medium) var(--openui-font-size-md)/24px var(--openui-font-body)",
  },
} as Record<"default" | "lg", React.CSSProperties>;

export const Link = defineComponent({
  name: "Link",
  props: LinkSchema,
  description: `Standalone link to a web page, shown with the site's favicon before the text. text is a short descriptive label (a page or site name, never a bare URL); url is an absolute https URL from a tool result or the user, never invented. size "default" fits everywhere else; "lg" is for a Link used as the title of a ListItem, StepsItem or TimelineItem, matching the title text: Link("Install the SDK", "https://…", "lg"). For links inside sentences, use a Markdown [text](url) link instead.`,
  component: ({ props }) => (
    <div style={STYLES[props.size === "lg" ? "lg" : "default"]}>
      <FaviconLink href={props.url as string} className="openui-markdown-renderer-link">
        {props.text as string}
      </FaviconLink>
    </div>
  ),
});

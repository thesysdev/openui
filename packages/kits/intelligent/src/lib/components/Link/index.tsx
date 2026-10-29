"use client";

import { defineComponent } from "@openuidev/react-lang";
import { ArrowUpRight } from "lucide-react";
import { str, webUrl } from "../style";
import { LinkSchema } from "./schema";

export * from "./schema";

export const Link = defineComponent({
  name: "Link",
  props: LinkSchema,
  description: "Opens an http(s) URL in a new tab.",
  component: ({ props }) => {
    const href = webUrl(props.url);
    if (!href) return <span>{str(props.text)}</span>;
    return (
      <a className="iui-link" href={href} target="_blank" rel="noopener noreferrer">
        {str(props.text) || new URL(href).hostname}
        <ArrowUpRight aria-hidden className="iui-link-arrow" />
      </a>
    );
  },
});

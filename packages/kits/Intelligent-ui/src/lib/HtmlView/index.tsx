"use client";

import { defineComponent, useIsStreaming } from "@openuidev/react-lang";
import { HtmlView as HtmlViewComponent } from "../../components/HtmlView";
import { HtmlViewSchema } from "./schema";

export * from "./schema";

export const HtmlView = defineComponent({
  name: "HtmlView",
  props: HtmlViewSchema,
  description: "Sandboxed HTML page with inline JS, for games and canvas. No network except script CDNs. Fits its content unless height is set.",
  component: function HtmlViewBinding({ props }) {
    const streaming = useIsStreaming();
    return (
      <HtmlViewComponent
        html={typeof props.html === "string" ? props.html : ""}
        height={props.height}
        title={props.title}
        pending={streaming}
      />
    );
  },
});

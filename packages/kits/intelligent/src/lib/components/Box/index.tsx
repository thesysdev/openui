"use client";

import { defineComponent } from "@openuidev/react-lang";
import { flexStyle } from "../layoutHelpers";
import { bg, cx, onColor, radius, size, space } from "../style";
import { BoxSchema } from "./schema";

export * from "./schema";

export const Box = defineComponent({
  name: "Box",
  props: BoxSchema,
  description: "Flex container, a column by default. radius also clips the content.",
  component: ({ props, renderNode }) => {
    const row = props.direction === "row";
    return (
      <div
        className={cx("iui-box", row ? "iui-row" : "iui-col", !row && props.gap == null && "iui-flow")}
        style={{
          ...flexStyle(props, !row),
          padding: space(props.padding),
          background: bg(props.background),
          ...onColor(props.background),
          borderRadius: radius(props.radius),
          overflow: props.radius !== undefined ? "clip" : undefined,
          border: props.border ? "1px solid var(--iui-border)" : undefined,
          width: size(props.width),
          height: size(props.height),
          // null, like an omitted argument, means no flex.
          // A width in px is meant: a Row with long text beside it must not squeeze it.
          flex: props.flex != null ? `${Math.max(0, props.flex)} 1 0%` : typeof props.width === "number" ? "0 0 auto" : undefined,
        }}
      >
        {renderNode(props.children)}
      </div>
    );
  },
});

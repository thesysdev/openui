"use client";

import { defineComponent } from "@openuidev/react-lang";
import { StackSchema } from "./schema";

export { StackSchema } from "./schema";

const gapMap: Record<string, string> = {
  none: "0",
  xs: "var(--openui-space-xs)",
  s: "var(--openui-space-s)",
  m: "var(--openui-space-m)",
  l: "var(--openui-space-l)",
  xl: "var(--openui-space-xl)",
  "2xl": "var(--openui-space-2xl)",
};

const alignMap: Record<string, string> = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  stretch: "stretch",
  baseline: "baseline",
};

const justifyMap: Record<string, string> = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  between: "space-between",
  around: "space-around",
  evenly: "space-evenly",
};

export const Stack = defineComponent({
  name: "Stack",
  props: StackSchema,
  description:
    'Flex container. direction: "row"|"column" (default "column"). gap: "none"|"xs"|"s"|"m"|"l"|"xl"|"2xl" (default "m"). align: "start"|"center"|"end"|"stretch"|"baseline". justify: "start"|"center"|"end"|"between"|"around"|"evenly".',
  component: ({ props, renderNode }) => {
    const justify = props.wrap && props.justify === "between" ? "start" : (props.justify as string);
    return (
      <div
        style={{
          display: "flex",
          flexDirection: ((props.direction as string) ?? "column") as "row" | "column",
          gap: gapMap[(props.gap as string) || "m"] || gapMap["m"],
          alignItems: alignMap[props.align as string],
          justifyContent: justifyMap[justify],
          flexWrap: props.wrap ? "wrap" : undefined,
        }}
      >
        {renderNode(props.children)}
      </div>
    );
  },
});

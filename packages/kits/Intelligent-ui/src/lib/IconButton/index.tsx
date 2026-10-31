"use client";

import { defineComponent, useIsStreaming } from "@openuidev/react-lang";
import { IconButton as IconButtonView } from "../../components/IconButton";
import { useRunAction } from "../controlHelpers";
import { IconButtonSchema } from "./schema";

export * from "./schema";

export const IconButton = defineComponent({
  name: "IconButton",
  props: IconButtonSchema,
  description: "Round icon-only button; label is read aloud.",
  component: ({ props }) => {
    const run = useRunAction();
    const streaming = useIsStreaming();
    const label = props.label || String(props.icon ?? "");
    return (
      <IconButtonView
        icon={props.icon}
        variant={props.variant}
        aria-label={label}
        title={props.label || undefined}
        disabled={streaming}
        onClick={() => run(label, props.action, false)}
      />
    );
  },
});

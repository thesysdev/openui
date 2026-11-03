"use client";

import { defineComponent, useIsStreaming } from "@openuidev/react-lang";
import { Button as ButtonView } from "../../components/Button";
import { useRunAction } from "../controls";
import { ButtonSchema } from "./schema";

export * from "./schema";

export const Button = defineComponent({
  name: "Button",
  props: ButtonSchema,
  description: "icon is a lucide name. Without an action it sends its label to the assistant.",
  component: ({ props }) => {
    const run = useRunAction();
    const streaming = useIsStreaming();
    const label = String(props.label ?? "");
    return (
      <ButtonView
        variant={props.variant}
        size={props.size}
        color={props.color}
        icon={props.icon}
        block={props.block}
        disabled={!!props.disabled || streaming}
        onClick={() => run(label, props.action, true)}
      >
        {label}
      </ButtonView>
    );
  },
});

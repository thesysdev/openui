"use client";

import { IconButton, IconWrapper } from "@openuidev/react-components";
import {
  defineComponent,
  useFormName,
  useIsStreaming,
  useTriggerAction,
  type ComponentRenderProps,
} from "@openuidev/react-lang";
import { toActionPlan } from "../Action/toActionPlan";
import { iconButtonPropsSchema, type IconButtonProps } from "./schema";
function IconButtonRenderer({ props }: ComponentRenderProps<IconButtonProps>) {
  const triggerAction = useTriggerAction();
  const formName = useFormName();
  const isStreaming = useIsStreaming();

  return (
    <IconButton
      aria-label={props.label}
      icon={<IconWrapper name={props.icon} category={props.category} />}
      variant={props.variant ?? "secondary"}
      tone={props.type === "destructive" ? "destructive" : "default"}
      size={props.size ?? "small"}
      shape={props.shape ?? "square"}
      disabled={isStreaming}
      onClick={() => triggerAction(props.label, formName, toActionPlan(props.action))}
    />
  );
}

export const IconButtonComponent = defineComponent({
  name: "IconButton",
  props: iconButtonPropsSchema,
  description: "",
  component: IconButtonRenderer,
});

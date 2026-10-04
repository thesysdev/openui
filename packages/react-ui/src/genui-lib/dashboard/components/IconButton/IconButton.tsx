"use client";

import {
  defineComponent,
  useFormName,
  useIsStreaming,
  useTriggerAction,
  type ActionPlan,
  type ComponentRenderProps,
} from "@openuidev/react-lang";
import { IconButton } from "../../../../components/IconButton";
import { IconWrapper } from "../Icon/IconWrapper";
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
      appearance={props.type === "destructive" ? "destructive" : "normal"}
      size={props.size ?? "small"}
      shape={props.shape ?? "square"}
      disabled={isStreaming}
      onClick={() => triggerAction(props.label, formName, props.action as ActionPlan)}
    />
  );
}

export const IconButtonComponent = defineComponent({
  name: "IconButton",
  props: iconButtonPropsSchema,
  description: "",
  component: IconButtonRenderer,
});

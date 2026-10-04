"use client";

import {
  defineComponent,
  useFormName,
  useIsStreaming,
  useTriggerAction,
  type ActionPlan,
  type ComponentRenderProps,
} from "@openuidev/react-lang";
import { Button } from "../../../../components/Button";
import { buttonPropsSchema, type ButtonProps } from "./schema";

const variantMap: Record<string, "primary" | "secondary" | "tertiary"> = {
  primary: "primary",
  secondary: "secondary",
  ghost: "tertiary",
  tertiary: "tertiary",
};

function ButtonRenderer({ props }: ComponentRenderProps<ButtonProps>) {
  const triggerAction = useTriggerAction();
  const formName = useFormName();
  const isStreaming = useIsStreaming();
  const variant = variantMap[props.variant as string] || "primary";

  const handleClick = () => {
    triggerAction(props.label, formName, props.action as ActionPlan);
  };

  return (
    <Button
      variant={variant}
      size={props.size ?? "medium"}
      buttonType={props.type ?? "normal"}
      disabled={isStreaming}
      onClick={handleClick}
    >
      {props.label}
    </Button>
  );
}

export const ButtonComponent = defineComponent({
  name: "Button",
  props: buttonPropsSchema,
  description: "",
  component: ButtonRenderer,
});

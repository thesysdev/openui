"use client";

import type { ActionPlan } from "@openuidev/react-lang";
import {
  ComponentRenderProps,
  defineComponent,
  useFormName,
  useIsStreaming,
  useTriggerAction,
} from "@openuidev/react-lang";
import { IconButton as OpenUIIconButton } from "../../components/IconButton";
import { IconWrapper } from "../../components/_shared/icons";
import { IconButtonSchema, type IconButtonProps } from "./schema";

export * from "./schema";

function IconButtonRenderer({ props }: ComponentRenderProps<IconButtonProps>) {
  const triggerAction = useTriggerAction();
  const formName = useFormName();
  const isStreaming = useIsStreaming();

  return (
    <OpenUIIconButton
      icon={<IconWrapper name={props.icon.props.name} category={props.icon.props.category} />}
      variant={props.variant ?? "secondary"}
      size={props.size ?? "medium"}
      shape={props.shape ?? "square"}
      disabled={isStreaming}
      aria-label={props.name}
      onClick={() => triggerAction(props.name, formName, props.action as ActionPlan | undefined)}
    />
  );
}

export const IconButton = defineComponent({
  name: "IconButton",
  props: IconButtonSchema,
  description:
    "Icon-only button. name is the accessible label and the action label; icon is an Icon; action fires on click.",
  component: IconButtonRenderer,
});

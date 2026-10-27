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
      // Agent icon buttons are circles matching the Button pills; the
      // genui classes set size and color, the base ones stay as-is.
      size="medium"
      shape="circle"
      className={
        props.size === "large"
          ? "openui-genui-icon-button openui-genui-icon-button--large"
          : "openui-genui-icon-button openui-genui-icon-button--default"
      }
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
    'A round icon-only button: IconButton(name, icon, action?, variant?, size?). name is the accessible label and the action\'s label, so it must say what the click does, e.g. IconButton("Share", Icon("share-2"), @ToAssistant("Share this itinerary"), "secondary"). Use it only where the icon alone is unmistakable (share, close, more, next) and space is tight, like a card corner or a row of tools; anything less obvious needs a Button with a label. variant "primary" (solid) | "secondary" | "tertiary" (lowest emphasis, the usual choice). size "default" (32px) for almost every case; "large" (40px) only beside a large Button.',
  component: IconButtonRenderer,
});

"use client";

import type { ActionPlan } from "@openuidev/react-lang";
import {
  ACTION_STEPS,
  defineComponent,
  useFormName,
  useFormValidation,
  useIsStreaming,
  useTriggerAction,
} from "@openuidev/react-lang";
import { Button as OpenUIButton } from "../../components/Button";
import { renderIconSlot } from "../iconSlot";
import { ButtonSchema } from "./schema";

export { ButtonSchema } from "./schema";

const variantMap: Record<string, "primary" | "secondary" | "tertiary"> = {
  primary: "primary",
  secondary: "secondary",
  ghost: "tertiary",
  tertiary: "tertiary",
};

export const Button = defineComponent({
  name: "Button",
  props: ButtonSchema,
  description:
    'A pill button: Button(label, action?, variant?, type?, size?, leading?). The label says exactly what clicking does, e.g. Button("Book a table", @ToAssistant("Book a table at Septime"), "primary"). variant "primary" (solid, the one main action in a group) | "secondary" (supporting actions) | "tertiary" (lowest emphasis, e.g. "Skip"). type "destructive" (red) only for an action that deletes or cancels something. size "default" (32px) for almost every button; "large" (40px) only for a single prominent call to action, never for a row of buttons. Don\'t use the older "extra-small" | "small" | "medium" sizes. leading is an optional Icon before the label, added only where it clarifies the action (e.g. Icon("external-link") on a button that opens a site); most buttons have none.',

  component: ({ props }) => {
    const triggerAction = useTriggerAction();
    const formName = useFormName();
    const isStreaming = useIsStreaming();
    const formValidation = useFormValidation();
    const label = props.label as string;

    return (
      <OpenUIButton
        variant={variantMap[props.variant as string] || "primary"}
        // Agent buttons are pills: default 32px or large 40px. The base size
        // class stays "medium"; the genui classes set height and shape.
        size="medium"
        className={
          props.size === "large"
            ? "openui-genui-button openui-genui-button--large"
            : "openui-genui-button openui-genui-button--default"
        }
        iconLeft={renderIconSlot(props.leading)}
        buttonType={props.type as "normal" | "destructive"}
        disabled={isStreaming}
        onClick={() => {
          const action = props.action as ActionPlan | undefined;
          const variant = (props.variant as string) || "primary";

          // Validate form for primary buttons before firing action
          if (formValidation && variant === "primary") {
            if (action?.steps) {
              // v0.5 ActionPlan: validate if any step is ToAssistant, a mutation, or a custom action
              const needsValidation = action.steps.some(
                (s) =>
                  s.type === ACTION_STEPS.ToAssistant ||
                  s.type === "custom_action" ||
                  (s.type === ACTION_STEPS.Run && s.refType === "mutation"),
              );
              if (needsValidation && !formValidation.validateForm()) return;
            } else {
              // v0.1 legacy or no action — always validate for primary buttons
              if (!formValidation.validateForm()) return;
            }
          }

          triggerAction(label, formName, action);
        }}
      >
        {label}
      </OpenUIButton>
    );
  },
});

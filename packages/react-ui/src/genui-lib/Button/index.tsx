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
  description: "Clickable button",
  component: ({ props }) => {
    const triggerAction = useTriggerAction();
    const formName = useFormName();
    const isStreaming = useIsStreaming();
    const formValidation = useFormValidation();
    const label = props.label as string;

    return (
      <OpenUIButton
        variant={variantMap[props.variant as string] || "primary"}
        size={(props.size as "extra-small" | "small" | "medium" | "large") || "medium"}
        buttonType={props.type as "normal" | "destructive"}
        disabled={isStreaming}
        onClick={() => {
          const action = props.action as ActionPlan | undefined;

          // Validate form for primary buttons with mutation/ToAssistant steps
          if (action?.steps && formValidation) {
            const variant = (props.variant as string) || "primary";
            if (variant === "primary") {
              const needsValidation = action.steps.some(
                (s) =>
                  s.type === ACTION_STEPS.ToAssistant ||
                  (s.type === ACTION_STEPS.Run && s.refType === "mutation"),
              );
              if (needsValidation && !formValidation.validateForm()) return;
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

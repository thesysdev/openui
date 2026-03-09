"use client";

import {
  BuiltinActionType,
  defineComponent,
  useFormName,
  useFormValidation,
  useIsStreaming,
  useTriggerAction,
} from "@openuidev/lang-react";
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
          const action = props.action as
            | { type?: string; url?: string; context?: string; params?: Record<string, any> }
            | undefined;
          const actionType = action?.type ?? BuiltinActionType.ContinueConversation;

          // Only validate for primary buttons with continue_conversation action (form submit).
          // Secondary/tertiary buttons (e.g. "Ask to customize") skip validation.
          const variant = (props.variant as string) || "primary";
          if (
            formValidation &&
            variant === "primary" &&
            actionType === BuiltinActionType.ContinueConversation
          ) {
            const valid = formValidation.validateForm();
            if (!valid) return;
          }
          const actionParams =
            actionType === BuiltinActionType.OpenUrl
              ? { url: action?.url }
              : {
                  ...(action?.params ?? {}),
                  ...(action?.context ? { context: action.context } : {}),
                };
          triggerAction(label, formName, {
            type: actionType,
            params: actionParams,
          });
        }}
      >
        {label}
      </OpenUIButton>
    );
  },
});

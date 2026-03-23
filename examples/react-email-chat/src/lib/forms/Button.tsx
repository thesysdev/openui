"use client";

import {
  BuiltinActionType,
  defineComponent,
  useFormName,
  useFormValidation,
  useIsStreaming,
  useTriggerAction,
} from "@openuidev/react-lang";
import { z } from "zod";

export const Button = defineComponent({
  name: "Button",
  props: z.object({
    label: z.string(),
    variant: z.enum(["primary", "secondary", "outline"]).optional(),
  }),
  description: "Action button for forms",
  component: ({ props }) => {
    const triggerAction = useTriggerAction();
    const formName = useFormName();
    const isStreaming = useIsStreaming();
    const formValidation = useFormValidation();

    const variant = (props.variant as string) ?? "primary";
    const isPrimary = variant === "primary";

    return (
      <button
        type="button"
        disabled={isStreaming}
        onClick={() => {
          // Validate on primary button click (form submit)
          if (formValidation && isPrimary) {
            const valid = formValidation.validateForm();
            if (!valid) return;
          }

          triggerAction(props.label as string, formName, {
            type: BuiltinActionType.ContinueConversation,
            params: {},
          });
        }}
        style={{
          padding: "10px 20px",
          fontSize: "14px",
          fontWeight: 600,
          borderRadius: "8px",
          border: isPrimary ? "none" : "1px solid #d1d5db",
          backgroundColor: isPrimary ? "#5F51E8" : "transparent",
          color: isPrimary ? "#fff" : "#374151",
          cursor: isStreaming ? "not-allowed" : "pointer",
          opacity: isStreaming ? 0.5 : 1,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        {props.label as string}
      </button>
    );
  },
});

"use client";

import { Button as ShadcnButton } from "@/components/ui/button";
import {
  BuiltinActionType,
  defineComponent,
  useFormName,
  useFormValidation,
  useIsStreaming,
  useTriggerAction,
} from "@openuidev/react-lang";
import { z } from "zod";
import { actionSchema, type ActionSchema } from "../action";

const ButtonSchema = z.object({
  label: z.string(),
  action: actionSchema,
  variant: z
    .enum(["default", "destructive", "outline", "secondary", "ghost", "link"])
    .optional(),
  size: z.enum(["default", "xs", "sm", "lg", "icon"]).optional(),
});

export const Button = defineComponent({
  name: "Button",
  props: ButtonSchema,
  description:
    'Clickable button. variant: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link". size: "default" | "xs" | "sm" | "lg" | "icon". action: { type: "continue_conversation" | "open_url", url? }.',
  component: ({ props }) => {
    const triggerAction = useTriggerAction();
    const formName = useFormName();
    const formValidation = useFormValidation();
    const isStreaming = useIsStreaming();

    const label = String(props.label ?? "");
    const action = props.action as ActionSchema;
    const variant = props.variant ?? "default";
    const size = props.size ?? "default";

    return (
      <ShadcnButton
        variant={variant}
        size={size}
        disabled={isStreaming}
        onClick={() => {
          const actionType = action?.type ?? BuiltinActionType.ContinueConversation;
          if (
            formValidation &&
            variant === "default" &&
            actionType === BuiltinActionType.ContinueConversation
          ) {
            const valid = formValidation.validateForm();
            if (!valid) return;
          }
          const actionParams =
            action?.type === BuiltinActionType.OpenUrl
              ? { url: (action as { url: string }).url }
              : (action as { params?: Record<string, unknown> })?.params;
          triggerAction(label, formName, { type: actionType, params: actionParams });
        }}
      >
        {label}
      </ShadcnButton>
    );
  },
});

"use client";

import MuiButton from "@mui/material/Button";
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
  variant: z.enum(["default", "destructive", "outline", "secondary", "ghost", "link"]).optional(),
  size: z.enum(["default", "xs", "sm", "lg", "icon"]).optional(),
});

const sizeMap: Record<string, "small" | "medium" | "large"> = {
  default: "medium",
  xs: "small",
  sm: "small",
  lg: "large",
  icon: "small",
};

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
    const v = props.variant ?? "default";

    const muiVariant = v === "outline" ? "outlined" : v === "ghost" || v === "link" ? "text" : "contained";
    const color = v === "destructive" ? "error" : v === "secondary" ? "secondary" : "primary";
    const muiSize = sizeMap[props.size ?? "default"] ?? "medium";

    return (
      <MuiButton
        variant={muiVariant}
        color={color}
        size={muiSize}
        disabled={isStreaming}
        sx={v === "link" ? { textDecoration: "underline" } : undefined}
        onClick={() => {
          const actionType = action?.type ?? BuiltinActionType.ContinueConversation;
          if (
            formValidation &&
            v === "default" &&
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
      </MuiButton>
    );
  },
});

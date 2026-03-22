"use client";

import { Button as HeroUIButton } from "@heroui/react";
import {
  BuiltinActionType,
  type ComponentRenderProps,
  defineComponent,
  useFormName,
  useFormValidation,
  useIsStreaming,
  useTriggerAction,
} from "@openuidev/react-lang";
import { z } from "zod";
import { actionSchema } from "../action";

const ButtonSchema = z.object({
  label: z.string(),
  action: actionSchema,
  variant: z.enum(["primary", "secondary", "tertiary", "outline", "ghost", "danger"]).optional(),
  size: z.enum(["sm", "md", "lg"]).optional(),
  fullWidth: z.boolean().optional(),
});

function ButtonRenderer({ props }: ComponentRenderProps<z.infer<typeof ButtonSchema>>) {
  const triggerAction = useTriggerAction();
  const formName = useFormName();
  const formValidation = useFormValidation();
  const isStreaming = useIsStreaming();

  const label = String(props.label ?? "");
  const action = props.action;
  const variant = props.variant ?? "primary";
  const size = props.size ?? "md";

  return (
    <HeroUIButton
      variant={variant}
      size={size}
      fullWidth={props.fullWidth}
      isDisabled={isStreaming}
      onPress={() => {
        const actionType = action?.type ?? BuiltinActionType.ContinueConversation;
        if (
          formValidation &&
          variant === "primary" &&
          actionType === BuiltinActionType.ContinueConversation
        ) {
          const valid = formValidation.validateForm();
          if (!valid) return;
        }
        const actionParams =
          action?.type === BuiltinActionType.OpenUrl
            ? { url: action.url }
            : action?.type === BuiltinActionType.ContinueConversation
              ? { context: action.context }
              : undefined;
        triggerAction(label, formName, { type: actionType, params: actionParams });
      }}
    >
      {label}
    </HeroUIButton>
  );
}

export const Button = defineComponent({
  name: "Button",
  props: ButtonSchema,
  description: "Clickable button",
  component: ButtonRenderer,
});

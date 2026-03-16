"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { BuiltinActionType, defineComponent, useTriggerAction } from "@openuidev/react-lang";
import { z } from "zod";

const AlertDialogBlockSchema = z.object({
  triggerLabel: z.string(),
  title: z.string(),
  description: z.string(),
  confirmLabel: z.string().optional(),
  cancelLabel: z.string().optional(),
  triggerVariant: z
    .enum(["default", "destructive", "outline", "secondary", "ghost", "link"])
    .optional(),
});

export const AlertDialogBlock = defineComponent({
  name: "AlertDialogBlock",
  props: AlertDialogBlockSchema,
  description:
    "Confirmation dialog with cancel and confirm buttons. Clicking confirm sends the confirmLabel as a message.",
  component: ({ props }) => {
    const triggerAction = useTriggerAction();
    const confirmLabel = props.confirmLabel ?? "Continue";
    const cancelLabel = props.cancelLabel ?? "Cancel";

    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant={props.triggerVariant ?? "outline"}>{props.triggerLabel}</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{props.title}</AlertDialogTitle>
            <AlertDialogDescription>{props.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                triggerAction(confirmLabel, undefined, {
                  type: BuiltinActionType.ContinueConversation,
                })
              }
            >
              {confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  },
});

"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";

const DialogBlockSchema = z.object({
  triggerLabel: z.string(),
  title: z.string(),
  description: z.string().optional(),
  content: z.array(z.any()).default([]),
  triggerVariant: z
    .enum(["default", "destructive", "outline", "secondary", "ghost", "link"])
    .optional(),
});

export const DialogBlock = defineComponent({
  name: "DialogBlock",
  props: DialogBlockSchema,
  description:
    "Modal dialog triggered by a button. triggerLabel: button text, title/description in header, content: children rendered inside.",
  component: ({ props, renderNode }) => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant={props.triggerVariant ?? "outline"}>{props.triggerLabel}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{props.title}</DialogTitle>
          {props.description && <DialogDescription>{props.description}</DialogDescription>}
        </DialogHeader>
        <div className="space-y-3">{renderNode(props.content)}</div>
      </DialogContent>
    </Dialog>
  ),
});

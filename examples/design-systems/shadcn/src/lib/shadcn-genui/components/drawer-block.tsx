"use client";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";

const DrawerBlockSchema = z.object({
  triggerLabel: z.string(),
  title: z.string(),
  description: z.string().optional(),
  content: z.array(z.any()).default([]),
});

export const DrawerBlock = defineComponent({
  name: "DrawerBlock",
  props: DrawerBlockSchema,
  description:
    "Bottom drawer panel triggered by a button. triggerLabel: button text, title/description in header, content: children rendered inside.",
  component: ({ props, renderNode }) => (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline">{props.triggerLabel}</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{props.title}</DrawerTitle>
          {props.description && <DrawerDescription>{props.description}</DrawerDescription>}
        </DrawerHeader>
        <div className="px-4 pb-4 space-y-3">{renderNode(props.content)}</div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ),
});

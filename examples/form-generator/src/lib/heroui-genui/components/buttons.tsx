"use client";

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";
import { Button } from "./button";

const ButtonsSchema = z.object({
  buttons: z.array(Button.ref),
});

export const Buttons = defineComponent({
  name: "Buttons",
  props: ButtonsSchema,
  description: "Row of Button components",
  component: ({ props, renderNode }) => (
    <div className="flex flex-row flex-wrap gap-2">
      {renderNode(props.buttons)}
    </div>
  ),
});

"use client";

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";
import { Button } from "./button";

const ButtonsSchema = z.object({
  buttons: z.array(Button.ref),
  direction: z.enum(["row", "column"]).optional(),
});

export const Buttons = defineComponent({
  name: "Buttons",
  props: ButtonsSchema,
  description: 'Group of Button components. direction: "row" | "column".',
  component: ({ props, renderNode }) => {
    const dir = props.direction ?? "row";
    return (
      <div className={`flex gap-2 ${dir === "column" ? "flex-col" : "flex-row flex-wrap"}`}>
        {renderNode(props.buttons)}
      </div>
    );
  },
});

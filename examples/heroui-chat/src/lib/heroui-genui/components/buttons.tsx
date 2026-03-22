"use client";

import { ButtonGroup } from "@heroui/react";
import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";
import { Button } from "./button";

const ButtonsSchema = z.object({
  buttons: z.array(Button.ref),
  grouped: z.boolean().optional(),
});

export const Buttons = defineComponent({
  name: "Buttons",
  props: ButtonsSchema,
  description:
    'Row of Button components. grouped: true joins buttons into a connected group with a separator between them.',
  component: ({ props, renderNode }) => {
    if (props.grouped) {
      return (
        <ButtonGroup>
          <ButtonGroup.Separator />
          {renderNode(props.buttons)}
        </ButtonGroup>
      );
    }
    return (
      <div className="flex flex-row flex-wrap gap-2">
        {renderNode(props.buttons)}
      </div>
    );
  },
});

"use client";

import Stack from "@mui/material/Stack";
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
  component: ({ props, renderNode }) => (
    <Stack direction={props.direction ?? "row"} spacing={1} useFlexGap flexWrap="wrap">
      {renderNode(props.buttons)}
    </Stack>
  ),
});

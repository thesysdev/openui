"use client";

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";
import { Button } from "./Button";

export const Buttons = defineComponent({
  name: "Buttons",
  props: z.object({
    buttons: z.array(Button.ref),
  }),
  description: "Group of Button components",
  component: ({ props, renderNode }) => {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: "8px",
          flexWrap: "wrap",
          marginTop: "8px",
        }}
      >
        {renderNode(props.buttons)}
      </div>
    );
  },
});

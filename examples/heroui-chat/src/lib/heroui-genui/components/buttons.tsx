"use client";

import { ButtonGroup } from "@heroui/react";
import { defineComponent } from "@openuidev/react-lang";
import { type ReactNode } from "react";
import { z } from "zod";
import { Button } from "./button";

function GroupSlot({
  __button_group_child,
  children,
}: {
  __button_group_child?: boolean;
  children: ReactNode;
}) {
  return <>{children}</>;
}

const ButtonsSchema = z.object({
  buttons: z.array(Button.ref),
  grouped: z.boolean().optional(),
});

export const Buttons = defineComponent({
  name: "Buttons",
  props: ButtonsSchema,
  description: "Row of Button components",
  component: ({ props, renderNode }) => {
    const buttons = props.buttons ?? [];
    if (props.grouped) {
      return (
        <ButtonGroup>
          {buttons.flatMap((btn, i) => {
            const els = [];
            if (i > 0) {
              els.push(
                <GroupSlot key={`sep-${i}`}>
                  <ButtonGroup.Separator />
                </GroupSlot>,
              );
            }
            els.push(<GroupSlot key={i}>{renderNode(btn)}</GroupSlot>);
            return els;
          })}
        </ButtonGroup>
      );
    }
    return (
      <div className="flex flex-row flex-wrap gap-2">
        {renderNode(buttons)}
      </div>
    );
  },
});

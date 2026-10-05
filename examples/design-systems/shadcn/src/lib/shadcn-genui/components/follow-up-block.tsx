"use client";

import { Button as ShadcnButton } from "@/components/ui/button";
import { defineComponent, useTriggerAction } from "@openuidev/react-lang";
import { z } from "zod";

const FollowUpItemSchema = z.object({
  text: z.string(),
});

export const FollowUpItem = defineComponent({
  name: "FollowUpItem",
  props: FollowUpItemSchema,
  description: "Clickable follow-up suggestion — sends text as user message when clicked.",
  component: () => null,
});

const FollowUpBlockSchema = z.object({
  items: z.array(FollowUpItem.ref),
});

export const FollowUpBlock = defineComponent({
  name: "FollowUpBlock",
  props: FollowUpBlockSchema,
  description: "List of follow-up suggestion chips at the end of a response.",
  component: ({ props }) => {
    const triggerAction = useTriggerAction();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = (props.items ?? []) as any[];

    return (
      <div className="flex flex-wrap gap-2">
        {items.map((item, i) => {
          const text = String(item?.props?.text ?? "");
          return (
            <ShadcnButton
              key={i}
              variant="outline"
              size="sm"
              className="h-auto py-1.5 px-3 text-xs"
              onClick={() => triggerAction(text)}
            >
              {text}
            </ShadcnButton>
          );
        })}
      </div>
    );
  },
});
